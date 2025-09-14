const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// AI Cost Management

// Cost tracking configuration
const COST_CONFIG = {
  openai: {
    'gpt-4o-mini': {
      input: 0.00015, // $0.15 per 1K tokens
      output: 0.0006  // $0.60 per 1K tokens
    }
  },
  huggingface: {
    'gpt2': {
      input: 0, // Free
      output: 0 // Free
    }
  }
};

// Usage limits
const USAGE_LIMITS = {
  FREE_DAILY_REQUESTS: parseInt(process.env.FREE_DAILY_REQ_LIMIT) || 100,
  RATE_LIMIT_RPM: parseInt(process.env.RATE_LIMIT_RPM) || 20,
  ALLOW_PAID: process.env.ALLOW_PAID === 'true'
};

// In-memory usage tracking (in production, use Redis or database)
const usageTracker = {
  daily: new Map(), // userId -> { requests: number, tokens: number, cost: number }
  rateLimit: new Map() // userId -> { requests: number[], lastReset: Date }
};

/**
 * Initialize usage tracking for a user
 */
const initializeUserUsage = (userId) => {
  const today = new Date().toDateString();
  
  if (!usageTracker.daily.has(userId)) {
    usageTracker.daily.set(userId, {
      requests: 0,
      tokens: 0,
      cost: 0,
      date: today
    });
  }
  
  if (!usageTracker.rateLimit.has(userId)) {
    usageTracker.rateLimit.set(userId, {
      requests: [],
      lastReset: new Date()
    });
  }
  
  // Reset daily usage if it's a new day
  const userDaily = usageTracker.daily.get(userId);
  if (userDaily.date !== today) {
    userDaily.requests = 0;
    userDaily.tokens = 0;
    userDaily.cost = 0;
    userDaily.date = today;
  }
};

/**
 * Check if user has exceeded rate limit
 */
const checkRateLimit = (userId) => {
  initializeUserUsage(userId);
  
  const rateLimitData = usageTracker.rateLimit.get(userId);
  const now = new Date();
  
  // Remove requests older than 1 minute
  rateLimitData.requests = rateLimitData.requests.filter(
    timestamp => now - timestamp < 60000
  );
  
  return rateLimitData.requests.length < USAGE_LIMITS.RATE_LIMIT_RPM;
};

/**
 * Record a request for rate limiting
 */
const recordRequest = (userId) => {
  const rateLimitData = usageTracker.rateLimit.get(userId);
  rateLimitData.requests.push(new Date());
};

/**
 * Check if user has exceeded daily free limit
 */
const checkDailyLimit = (userId) => {
  initializeUserUsage(userId);
  
  const dailyData = usageTracker.daily.get(userId);
  return dailyData.requests < USAGE_LIMITS.FREE_DAILY_REQUESTS;
};

/**
 * Calculate cost for a request
 */
const calculateCost = (provider, model, inputTokens, outputTokens) => {
  const modelConfig = COST_CONFIG[provider]?.[model];
  if (!modelConfig) {
    return 0; // Unknown model, assume free
  }
  
  const inputCost = (inputTokens / 1000) * modelConfig.input;
  const outputCost = (outputTokens / 1000) * modelConfig.output;
  
  return inputCost + outputCost;
};

/**
 * Record usage and cost
 */
const recordUsage = (userId, provider, model, inputTokens, outputTokens) => {
  initializeUserUsage(userId);
  
  const dailyData = usageTracker.daily.get(userId);
  const cost = calculateCost(provider, model, inputTokens, outputTokens);
  
  dailyData.requests++;
  dailyData.tokens += inputTokens + outputTokens;
  dailyData.cost += cost;
  
  // Log usage to database (optional)
  logUsageToDatabase(userId, provider, model, inputTokens, outputTokens, cost);
};

/**
 * Log usage to database
 */
const logUsageToDatabase = async (userId, provider, model, inputTokens, outputTokens, cost) => {
  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        provider: provider,
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost: cost,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging usage to database:', error);
    }
  } catch (error) {
    console.error('Error logging usage to database:', error);
  }
};

/**
 * Get user usage statistics
 */
const getUserUsage = (userId) => {
  initializeUserUsage(userId);
  
  const dailyData = usageTracker.daily.get(userId);
  const rateLimitData = usageTracker.rateLimit.get(userId);
  
  return {
    daily: {
      requests: dailyData.requests,
      tokens: dailyData.tokens,
      cost: dailyData.cost,
      limit: USAGE_LIMITS.FREE_DAILY_REQUESTS,
      remaining: Math.max(0, USAGE_LIMITS.FREE_DAILY_REQUESTS - dailyData.requests)
    },
    rateLimit: {
      requests: rateLimitData.requests.length,
      limit: USAGE_LIMITS.RATE_LIMIT_RPM,
      remaining: Math.max(0, USAGE_LIMITS.RATE_LIMIT_RPM - rateLimitData.requests.length),
      resetTime: new Date(rateLimitData.requests[0]?.getTime() + 60000) || new Date()
    },
    limits: USAGE_LIMITS
  };
};

/**
 * Check if user can make a request
 */
const canMakeRequest = (userId) => {
  const rateLimitOk = checkRateLimit(userId);
  const dailyLimitOk = checkDailyLimit(userId);
  
  return {
    allowed: rateLimitOk && (dailyLimitOk || USAGE_LIMITS.ALLOW_PAID),
    rateLimitOk,
    dailyLimitOk,
    willUsePaid: !dailyLimitOk && USAGE_LIMITS.ALLOW_PAID
  };
};

/**
 * Get cost summary for a period
 */
const getCostSummary = async (startDate, endDate) => {
  try {
    const { data: logs, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) throw error;
    
    const summary = {
      totalRequests: logs.length,
      totalTokens: logs.reduce((sum, log) => sum + log.input_tokens + log.output_tokens, 0),
      totalCost: logs.reduce((sum, log) => sum + log.cost, 0),
      byProvider: {},
      byModel: {},
      dailyBreakdown: {}
    };
    
    logs.forEach(log => {
      // By provider
      summary.byProvider[log.provider] = (summary.byProvider[log.provider] || 0) + log.cost;
      
      // By model
      summary.byModel[log.model] = (summary.byModel[log.model] || 0) + log.cost;
      
      // Daily breakdown
      const day = new Date(log.created_at).toDateString();
      summary.dailyBreakdown[day] = (summary.dailyBreakdown[day] || 0) + log.cost;
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting cost summary:', error);
    throw error;
  }
};

/**
 * Get usage alerts
 */
const getUsageAlerts = (userId) => {
  const usage = getUserUsage(userId);
  const alerts = [];
  
  // Daily limit warning
  if (usage.daily.requests > USAGE_LIMITS.FREE_DAILY_REQUESTS * 0.8) {
    alerts.push({
      type: 'warning',
      message: `הגעת ל-${Math.round((usage.daily.requests / USAGE_LIMITS.FREE_DAILY_REQUESTS) * 100)}% ממכסת הבקשות היומית החינמית`,
      action: 'שקול לשדרג לתכנית בתשלום'
    });
  }
  
  // Rate limit warning
  if (usage.rateLimit.requests > USAGE_LIMITS.RATE_LIMIT_RPM * 0.8) {
    alerts.push({
      type: 'warning',
      message: `הגעת ל-${Math.round((usage.rateLimit.requests / USAGE_LIMITS.RATE_LIMIT_RPM) * 100)}% ממגבלת הבקשות לדקה`,
      action: 'המתן לפני שליחת בקשה נוספת'
    });
  }
  
  // Cost warning
  if (usage.daily.cost > 1) { // $1 per day
    alerts.push({
      type: 'info',
      message: `עלות יומית: $${usage.daily.cost.toFixed(2)}`,
      action: 'עקוב אחר העלויות'
    });
  }
  
  return alerts;
};

module.exports = {
  checkRateLimit,
  recordRequest,
  checkDailyLimit,
  calculateCost,
  recordUsage,
  getUserUsage,
  canMakeRequest,
  getCostSummary,
  getUsageAlerts,
  USAGE_LIMITS,
  COST_CONFIG
};
