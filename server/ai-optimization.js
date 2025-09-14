const NodeCache = require('node-cache');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache configuration
const CACHE_CONFIG = {
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
};

// Initialize caches
const responseCache = new NodeCache(CACHE_CONFIG);
const analyticsCache = new NodeCache({ ...CACHE_CONFIG, stdTTL: 600 }); // 10 minutes for analytics
const businessDataCache = new NodeCache({ ...CACHE_CONFIG, stdTTL: 1800 }); // 30 minutes for business data

/**
 * Generate cache key for chat responses
 */
const generateChatCacheKey = (messages, provider) => {
  const messageHash = messages
    .map(msg => `${msg.role}:${msg.content}`)
    .join('|');
  return `chat:${provider}:${Buffer.from(messageHash).toString('base64').slice(0, 32)}`;
};

/**
 * Generate cache key for analytics
 */
const generateAnalyticsCacheKey = (type, params) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `analytics:${type}:${Buffer.from(paramString).toString('base64').slice(0, 32)}`;
};

/**
 * Cache chat response
 */
const cacheChatResponse = (messages, provider, response) => {
  const key = generateChatCacheKey(messages, provider);
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
    messageCount: messages.length
  });
};

/**
 * Get cached chat response
 */
const getCachedChatResponse = (messages, provider) => {
  const key = generateChatCacheKey(messages, provider);
  const cached = responseCache.get(key);
  
  if (cached) {
    console.log(`Cache hit for chat response: ${key}`);
    return cached.response;
  }
  
  return null;
};

/**
 * Cache analytics data
 */
const cacheAnalytics = (type, params, data) => {
  const key = generateAnalyticsCacheKey(type, params);
  analyticsCache.set(key, {
    data,
    timestamp: Date.now(),
    type,
    params
  });
};

/**
 * Get cached analytics data
 */
const getCachedAnalytics = (type, params) => {
  const key = generateAnalyticsCacheKey(type, params);
  const cached = analyticsCache.get(key);
  
  if (cached) {
    console.log(`Cache hit for analytics: ${type}`);
    return cached.data;
  }
  
  return null;
};

/**
 * Cache business data
 */
const cacheBusinessData = (key, data) => {
  businessDataCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Get cached business data
 */
const getCachedBusinessData = (key) => {
  const cached = businessDataCache.get(key);
  
  if (cached) {
    console.log(`Cache hit for business data: ${key}`);
    return cached.data;
  }
  
  return null;
};

/**
 * Optimize message for better performance
 */
const optimizeMessage = (message) => {
  // Remove extra whitespace
  message = message.trim();
  
  // Limit message length for performance
  if (message.length > 2000) {
    message = message.substring(0, 2000) + '...';
  }
  
  return message;
};

/**
 * Optimize messages array
 */
const optimizeMessages = (messages) => {
  return messages.map(msg => ({
    ...msg,
    content: optimizeMessage(msg.content)
  }));
};

/**
 * Batch database queries for better performance
 */
const batchDatabaseQueries = async (queries) => {
  try {
    const results = await Promise.all(queries);
    return results;
  } catch (error) {
    console.error('Error in batch database queries:', error);
    throw error;
  }
};

/**
 * Optimize database query with pagination
 */
const optimizeDatabaseQuery = (query, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  return query.range(offset, offset + limit - 1);
};

/**
 * Compress response data
 */
const compressResponse = (data) => {
  // Remove unnecessary fields
  if (data.usage) {
    delete data.usage.dailyBreakdown;
    delete data.usage.monthlyTrend;
  }
  
  // Limit array sizes
  if (data.topBrands && Array.isArray(data.topBrands)) {
    data.topBrands = data.topBrands.slice(0, 5);
  }
  
  if (data.topModels && Array.isArray(data.topModels)) {
    data.topModels = data.topModels.slice(0, 5);
  }
  
  return data;
};

/**
 * Performance monitoring
 */
const performanceMonitor = {
  startTime: null,
  
  start() {
    this.startTime = Date.now();
  },
  
  end(operation) {
    if (this.startTime) {
      const duration = Date.now() - this.startTime;
      console.log(`Performance: ${operation} took ${duration}ms`);
      
      // Log slow operations
      if (duration > 3000) {
        console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
      }
      
      this.startTime = null;
      return duration;
    }
    return 0;
  }
};

/**
 * Connection pooling for database
 */
const connectionPool = {
  activeConnections: 0,
  maxConnections: 10,
  
  async acquire() {
    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }
    
    this.activeConnections++;
    return true;
  },
  
  release() {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }
};

/**
 * Optimize AI response generation
 */
const optimizeAIResponse = async (messages, provider, generateFunction) => {
  // Check cache first
  const cached = getCachedChatResponse(messages, provider);
  if (cached) {
    return cached;
  }
  
  // Optimize messages
  const optimizedMessages = optimizeMessages(messages);
  
  // Generate response
  const response = await generateFunction(optimizedMessages);
  
  // Cache response
  cacheChatResponse(optimizedMessages, provider, response);
  
  return response;
};

/**
 * Optimize analytics generation
 */
const optimizeAnalytics = async (type, params, generateFunction) => {
  // Check cache first
  const cached = getCachedAnalytics(type, params);
  if (cached) {
    return cached;
  }
  
  // Generate analytics
  const data = await generateFunction(params);
  
  // Compress and cache
  const compressedData = compressResponse(data);
  cacheAnalytics(type, params, compressedData);
  
  return compressedData;
};

/**
 * Memory usage monitoring
 */
const memoryMonitor = {
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  },
  
  checkMemoryLimit() {
    const usage = this.getMemoryUsage();
    const limit = 512; // 512MB limit
    
    if (usage.heapUsed > limit) {
      console.warn(`Memory usage high: ${usage.heapUsed}MB`);
      
      // Clear caches if memory usage is too high
      if (usage.heapUsed > limit * 1.5) {
        this.clearCaches();
      }
    }
    
    return usage;
  },
  
  clearCaches() {
    responseCache.flushAll();
    analyticsCache.flushAll();
    businessDataCache.flushAll();
    console.log('Caches cleared due to high memory usage');
  }
};

/**
 * Cache statistics
 */
const getCacheStats = () => {
  return {
    responseCache: {
      keys: responseCache.keys().length,
      hits: responseCache.getStats().hits,
      misses: responseCache.getStats().misses
    },
    analyticsCache: {
      keys: analyticsCache.keys().length,
      hits: analyticsCache.getStats().hits,
      misses: analyticsCache.getStats().misses
    },
    businessDataCache: {
      keys: businessDataCache.keys().length,
      hits: businessDataCache.getStats().hits,
      misses: businessDataCache.getStats().misses
    }
  };
};

/**
 * Cleanup expired cache entries
 */
const cleanupCache = () => {
  responseCache.flushAll();
  analyticsCache.flushAll();
  businessDataCache.flushAll();
  console.log('Cache cleanup completed');
};

// Schedule cache cleanup every hour
setInterval(cleanupCache, 60 * 60 * 1000);

// Schedule memory monitoring every 5 minutes
setInterval(() => {
  memoryMonitor.checkMemoryLimit();
}, 5 * 60 * 1000);

module.exports = {
  cacheChatResponse,
  getCachedChatResponse,
  cacheAnalytics,
  getCachedAnalytics,
  cacheBusinessData,
  getCachedBusinessData,
  optimizeMessage,
  optimizeMessages,
  batchDatabaseQueries,
  optimizeDatabaseQuery,
  compressResponse,
  performanceMonitor,
  connectionPool,
  optimizeAIResponse,
  optimizeAnalytics,
  memoryMonitor,
  getCacheStats,
  cleanupCache
};
