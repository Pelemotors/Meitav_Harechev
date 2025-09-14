const express = require('express');
const { openai } = require('@ai-sdk/openai');
const { HfInference } = require('@huggingface/inference');
const { generateText, streamText } = require('ai');
const { z } = require('zod');
const { getBusinessInsights, getSalesAnalytics, getLeadsAnalytics, getInventoryAnalytics, getPerformanceAnalytics } = require('./business-analytics');
const { canMakeRequest, recordRequest, recordUsage, getUserUsage, getCostSummary, getUsageAlerts } = require('./ai-cost-manager');
const { aiRateLimit, aiCors, authenticateToken, requireRole, validateInput, logAIRequest, securityHeaders } = require('./ai-security');
const { optimizeAIResponse, optimizeAnalytics, performanceMonitor, memoryMonitor, getCacheStats } = require('./ai-optimization');

const router = express.Router();

// Apply security middleware to all AI routes
router.use(securityHeaders);
router.use(aiCors);
router.use(aiRateLimit);
router.use(logAIRequest);

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Validation schema for chat messages
const chatMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).min(1),
  provider: z.enum(['openai', 'hf', 'auto']).optional().default('auto'),
  stream: z.boolean().optional().default(true)
});

// System prompt for Strong Luxury Cars
const SYSTEM_PROMPT = `אתה עוזר AI חכם עבור Strong Luxury Cars - סוכנות רכבי יוקרה בישראל.

תפקידך:
1. לענות על שאלות על רכבי יוקרה, מכירות, ושירותים
2. לנתח נתונים עסקיים ולספק תובנות
3. לעזור בניהול לידים ומכירות
4. לספק המלצות עסקיות מבוססות נתונים

כללי התנהגות:
- תמיד ענה בעברית
- היה מקצועי וידידותי
- ספק מידע מדויק ומעודכן
- אם אינך יודע משהו, אמור זאת בכנות
- השתמש בנתונים הקיימים במערכת לניתוחים

הקשר עסקי:
- החברה מתמחה ברכבי יוקרה
- יש לנו מערכת ניהול לידים
- אנו מספקים שירותי מימון וייעוץ
- הלקוחות שלנו מחפשים רכבי יוקרה איכותיים`;

// Mock data functions for business analysis
const getMockSalesData = () => ({
  monthly: [
    { month: 'ינואר', sales: 12, revenue: 2400000 },
    { month: 'פברואר', sales: 15, revenue: 3000000 },
    { month: 'מרץ', sales: 18, revenue: 3600000 },
    { month: 'אפריל', sales: 14, revenue: 2800000 },
    { month: 'מאי', sales: 20, revenue: 4000000 },
    { month: 'יוני', sales: 16, revenue: 3200000 }
  ],
  topModels: [
    { model: 'BMW X5', sales: 8, revenue: 1600000 },
    { model: 'Mercedes GLE', sales: 6, revenue: 1200000 },
    { model: 'Audi Q7', sales: 5, revenue: 1000000 },
    { model: 'Porsche Cayenne', sales: 4, revenue: 800000 },
    { model: 'Range Rover', sales: 3, revenue: 600000 }
  ]
});

const getMockLeadsData = () => ({
  total: 45,
  new: 12,
  contacted: 18,
  qualified: 8,
  proposal: 4,
  closed: 3,
  sources: {
    website: 20,
    whatsapp: 15,
    phone: 6,
    referral: 4
  }
});

// Helper function to detect business questions
const isBusinessQuestion = (message) => {
  const businessKeywords = [
    'מכירות', 'לידים', 'הכנסות', 'ביצועים', 'נתונים', 'סטטיסטיקות',
    'דוח', 'ניתוח', 'מגמות', 'המלצות', 'אסטרטגיה', 'תחזית'
  ];
  
  return businessKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Helper function to get business context
const getBusinessContext = async (message) => {
  try {
    // Get date range for analytics (last 30 days)
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get real business insights
    const insights = await getBusinessInsights(message, startDate, endDate);
    return insights;
  } catch (error) {
    console.error('Error getting business context:', error);
    // Fallback to mock data
    let context = '';
    
    if (message.includes('מכירות') || message.includes('הכנסות')) {
      const salesData = getMockSalesData();
      context += `\nנתוני מכירות (נתונים לדוגמה):\n${JSON.stringify(salesData, null, 2)}\n`;
    }
    
    if (message.includes('לידים') || message.includes('לקוחות פוטנציאליים')) {
      const leadsData = getMockLeadsData();
      context += `\nנתוני לידים (נתונים לדוגמה):\n${JSON.stringify(leadsData, null, 2)}\n`;
    }
    
    return context;
  }
};

// Helper function to call Hugging Face API
const callHuggingFace = async (messages) => {
  try {
    // Convert messages to a single prompt
    const prompt = messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        return `Assistant: ${msg.content}`;
      }
    }).join('\n') + '\nAssistant:';

    // Use a configurable model from environment or default to gpt2
    const model = process.env.HUGGINGFACE_MODEL || 'gpt2';
    console.log(`Using Hugging Face model: ${model}`);
    
    const response = await hf.textGeneration({
      model: model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        return_full_text: false
      }
    });

    return response.generated_text || 'מצטער, לא הצלחתי לייצר תשובה.';
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error('Hugging Face API failed');
  }
};

// POST /api/ai/chat - Main chat endpoint
router.post('/chat', authenticateToken, requireRole(['admin', 'user']), validateInput, async (req, res) => {
  try {
    // Validate request body
    const { messages, provider, stream } = chatMessageSchema.parse(req.body);
    
    // Get user ID from JWT token
    const userId = req.user.id;
    
    // Check if user can make request
    const requestCheck = canMakeRequest(userId);
    if (!requestCheck.allowed) {
      return res.status(429).json({
        error: 'מגבלת שימוש',
        message: requestCheck.rateLimitOk ? 
          'הגעת למכסת הבקשות היומית החינמית' : 
          'יותר מדי בקשות בדקה',
        usage: getUserUsage(userId)
      });
    }
    
    // Record the request for rate limiting
    recordRequest(userId);
    
    // Start performance monitoring
    performanceMonitor.start();
    
    // Check if this is a business question
    const lastMessage = messages[messages.length - 1];
    const isBusiness = isBusinessQuestion(lastMessage.content);
    
    // Get business context if needed
    let businessContext = '';
    if (isBusiness) {
      businessContext = await getBusinessContext(lastMessage.content);
    }
    
    // Prepare messages with system prompt and business context
    const systemMessage = {
      role: 'system',
      content: SYSTEM_PROMPT + businessContext
    };
    
    const fullMessages = [systemMessage, ...messages];
    
    let response;
    let fallbackUsed = false;
    
    try {
      if (provider === 'openai' || provider === 'auto') {
        // Try OpenAI first
        if (stream) {
          const result = await streamText({
            model: openai('gpt-4o-mini'),
            messages: fullMessages,
            temperature: 0.7,
            maxTokens: 1000
          });
          
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          for await (const delta of result.textStream) {
            res.write(delta);
          }
          res.end();
          return;
        } else {
          response = await generateText({
            model: openai('gpt-4o-mini'),
            messages: fullMessages,
            temperature: 0.7,
            maxTokens: 1000
          });
        }
      } else if (provider === 'hf') {
        // Use Hugging Face directly
        const hfResponse = await callHuggingFace(fullMessages);
        response = { text: hfResponse };
      } else {
        throw new Error('Invalid provider specified');
      }
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError);
      
      if (provider === 'auto') {
        // Fallback to Hugging Face
        try {
          fallbackUsed = true;
          const hfResponse = await callHuggingFace(fullMessages);
          response = { text: hfResponse };
        } catch (hfError) {
          console.error('Hugging Face error:', hfError);
          throw new Error('All AI providers failed');
        }
      } else {
        throw openaiError;
      }
    }
    
    // Record usage and cost
    const finalProvider = fallbackUsed ? 'huggingface' : provider;
    const model = finalProvider === 'openai' ? 'gpt-4o-mini' : 'gpt2';
    
    // Estimate token usage (rough calculation)
    const inputTokens = fullMessages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    const outputTokens = Math.ceil(response.text.length / 4);
    
    recordUsage(userId, finalProvider, model, inputTokens, outputTokens);
    
    // Get usage alerts
    const alerts = getUsageAlerts(userId);
    
    // End performance monitoring
    const duration = performanceMonitor.end('AI Chat Response');
    
    // Check memory usage
    const memoryUsage = memoryMonitor.checkMemoryLimit();
    
    // Send response
    res.json({
      message: response.text,
      fallbackUsed,
      provider: finalProvider,
      timestamp: new Date().toISOString(),
      usage: getUserUsage(userId),
      alerts: alerts,
      willUsePaid: requestCheck.willUsePaid,
      performance: {
        duration: `${duration}ms`,
        memoryUsage: memoryUsage.heapUsed
      }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.errors.map(err => err.message)
      });
    }
    
    res.status(500).json({
      error: 'שגיאה בעיבוד הבקשה',
      message: error.message
    });
  }
});

// GET /api/ai/providers - Get available AI providers
router.get('/providers', (req, res) => {
  res.json({
    providers: [
      {
        id: 'openai',
        name: 'OpenAI GPT-4o-mini',
        status: 'available',
        description: 'מודל AI מתקדם של OpenAI'
      },
      {
        id: 'hf',
        name: 'Hugging Face',
        status: 'available',
        description: 'מודלים חינמיים של Hugging Face'
      },
      {
        id: 'auto',
        name: 'אוטומטי',
        status: 'available',
        description: 'מעבר אוטומטי בין OpenAI ל-Hugging Face'
      }
    ]
  });
});

// GET /api/ai/health - Health check for AI services
router.get('/health', async (req, res) => {
  try {
    const health = {
      openai: 'unknown',
      huggingface: 'unknown',
      timestamp: new Date().toISOString()
    };
    
    // Test OpenAI connection
    try {
      await generateText({
        model: openai('gpt-4o-mini'),
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 1
      });
      health.openai = 'healthy';
    } catch (error) {
      health.openai = 'error';
      health.openaiError = error.message;
    }
    
    // Test Hugging Face connection
    try {
      const model = process.env.HUGGINGFACE_MODEL || 'distilbert-base-uncased';
      await hf.fillMask({
        model: model,
        inputs: 'Hello [MASK] world!'
      });
      health.huggingface = 'healthy';
    } catch (error) {
      health.huggingface = 'error';
      health.huggingfaceError = error.message;
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: 'שגיאה בבדיקת בריאות השירותים',
      message: error.message
    });
  }
});

// GET /api/ai/analytics/sales - Get sales analytics
router.get('/analytics/sales', authenticateToken, requireRole(['admin', 'user']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'תאריכי התחלה וסיום נדרשים',
        message: 'יש לספק startDate ו-endDate בפרמטרים'
      });
    }
    
    performanceMonitor.start();
    
    const analytics = await optimizeAnalytics('sales', { startDate, endDate }, async (params) => {
      return await getSalesAnalytics(params.startDate, params.endDate);
    });
    
    const duration = performanceMonitor.end('Sales Analytics');
    
    res.json({
      ...analytics,
      performance: {
        duration: `${duration}ms`
      }
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת נתוני מכירות',
      message: error.message
    });
  }
});

// GET /api/ai/analytics/leads - Get leads analytics
router.get('/analytics/leads', authenticateToken, requireRole(['admin', 'user']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'תאריכי התחלה וסיום נדרשים',
        message: 'יש לספק startDate ו-endDate בפרמטרים'
      });
    }
    
    const analytics = await getLeadsAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting leads analytics:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת נתוני לידים',
      message: error.message
    });
  }
});

// GET /api/ai/analytics/inventory - Get inventory analytics
router.get('/analytics/inventory', authenticateToken, requireRole(['admin', 'user']), async (req, res) => {
  try {
    const analytics = await getInventoryAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error getting inventory analytics:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת נתוני מלאי',
      message: error.message
    });
  }
});

// GET /api/ai/analytics/performance - Get comprehensive performance analytics
router.get('/analytics/performance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'תאריכי התחלה וסיום נדרשים',
        message: 'יש לספק startDate ו-endDate בפרמטרים'
      });
    }
    
    const analytics = await getPerformanceAnalytics(startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting performance analytics:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת נתוני ביצועים',
      message: error.message
    });
  }
});

// GET /api/ai/usage - Get user usage statistics
router.get('/usage', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const usage = getUserUsage(userId);
    const alerts = getUsageAlerts(userId);
    
    res.json({
      usage,
      alerts
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת נתוני שימוש',
      message: error.message
    });
  }
});

// GET /api/ai/costs - Get cost summary
router.get('/costs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'תאריכי התחלה וסיום נדרשים',
        message: 'יש לספק startDate ו-endDate בפרמטרים'
      });
    }
    
    const summary = await getCostSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error getting cost summary:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת סיכום עלויות',
      message: error.message
    });
  }
});

// GET /api/ai/performance - Get performance statistics
router.get('/performance', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const cacheStats = getCacheStats();
    const memoryUsage = memoryMonitor.getMemoryUsage();
    
    res.json({
      cache: cacheStats,
      memory: memoryUsage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance stats:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת סטטיסטיקות ביצועים',
      message: error.message
    });
  }
});

module.exports = router;
