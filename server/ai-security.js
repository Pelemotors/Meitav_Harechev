const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Security Configuration
const SECURITY_CONFIG = {
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 20, // 20 requests per window
  JWT_EXPIRES_IN: '24h',
  MAX_MESSAGE_LENGTH: 2000,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173']
};

/**
 * Rate limiting middleware for AI endpoints
 */
const aiRateLimit = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'יותר מדי בקשות',
    message: 'הגעת למגבלת הבקשות. נסה שוב מאוחר יותר.',
    retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/ai/health';
  }
});

/**
 * CORS middleware for AI endpoints
 */
const aiCors = (req, res, next) => {
  const origin = req.headers.origin;
  
  if (SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * JWT Authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: 'לא מורשה',
      message: 'נדרש טוקן אימות'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user || !user.is_active) {
      return res.status(401).json({
        error: 'לא מורשה',
        message: 'משתמש לא נמצא או לא פעיל'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'לא מורשה',
      message: 'טוקן לא תקין או פג תוקף'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'לא מורשה',
        message: 'נדרש אימות'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'אין הרשאה',
        message: 'אין לך הרשאה לגשת למשאב זה'
      });
    }
    
    next();
  };
};

/**
 * Input validation middleware
 */
const validateInput = (req, res, next) => {
  // Check message length
  if (req.body.messages) {
    for (const message of req.body.messages) {
      if (message.content && message.content.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          error: 'קלט לא תקין',
          message: `הודעה ארוכה מדי. מקסימום ${SECURITY_CONFIG.MAX_MESSAGE_LENGTH} תווים`
        });
      }
    }
  }
  
  // Check for malicious content
  const content = JSON.stringify(req.body);
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(content))) {
    return res.status(400).json({
      error: 'תוכן לא מורשה',
      message: 'הקלט מכיל תוכן לא מורשה'
    });
  }
  
  next();
};

/**
 * Logging middleware for AI requests
 */
const logAIRequest = async (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`AI Request: ${req.method} ${req.path}`, {
    user: req.user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(`AI Response: ${req.method} ${req.path}`, {
      user: req.user?.id || 'anonymous',
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Log to database
    logToDatabase(req, res, data, duration);
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Log request to database
 */
const logToDatabase = async (req, res, data, duration) => {
  try {
    await supabase
      .from('ai_request_logs')
      .insert({
        user_id: req.user?.id || null,
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        duration_ms: duration,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_size: JSON.stringify(req.body).length,
        response_size: JSON.stringify(data).length,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging to database:', error);
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  next();
};

/**
 * API Key validation middleware
 */
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'לא מורשה',
      message: 'נדרש מפתח API'
    });
  }
  
  // In production, validate against database
  const validAPIKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
  
  if (!validAPIKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'לא מורשה',
      message: 'מפתח API לא תקין'
    });
  }
  
  next();
};

module.exports = {
  aiRateLimit,
  aiCors,
  authenticateToken,
  requireRole,
  validateInput,
  logAIRequest,
  generateToken,
  verifyToken,
  securityHeaders,
  validateAPIKey,
  SECURITY_CONFIG
};
