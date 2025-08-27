// מערכת Rate Limiting להגנה על המערכת
// מניעת התקפות DDoS ו-API abuse

export interface RateLimitConfig {
  windowMs: number; // חלון זמן במילישניות
  maxRequests: number; // מספר מקסימלי של בקשות בחלון
  skipSuccessfulRequests?: boolean; // האם לדלג על בקשות מוצלחות
  skipFailedRequests?: boolean; // האם לדלג על בקשות שנכשלו
  message?: string; // הודעת שגיאה
  statusCode?: number; // קוד סטטוס HTTP
  keyGenerator?: (req: any) => string; // פונקציה ליצירת מפתח
  handler?: (req: any, res: any) => void; // handler מותאם אישית
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp של איפוס
  retryAfter?: number; // זמן המתנה במילישניות
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  retryAfter?: number;
}

class RateLimiter {
  private store: Map<string, {
    count: number;
    resetTime: number;
  }> = new Map();

  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 דקות ברירת מחדל
      maxRequests: 100, // 100 בקשות ברירת מחדל
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
      statusCode: 429,
      ...config
    };
  }

  // יצירת מפתח ייחודי למשתמש
  private generateKey(identifier: string): string {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    return `${identifier}:${windowStart}`;
  }

  // בדיקת Rate Limit
  checkLimit(identifier: string): RateLimitResult {
    const key = this.generateKey(identifier);
    const now = Date.now();
    
    // ניקוי נתונים ישנים
    this.cleanup();

    // קבלת נתונים נוכחיים
    const current = this.store.get(key) || {
      count: 0,
      resetTime: now + this.config.windowMs
    };

    // בדיקה אם הבקשה מותרת
    const allowed = current.count < this.config.maxRequests;

    if (allowed) {
      // עדכון מונה
      current.count++;
      this.store.set(key, current);
    }

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      reset: current.resetTime
    };

    if (!allowed) {
      info.retryAfter = current.resetTime - now;
    }

    return {
      allowed,
      info,
      retryAfter: info.retryAfter
    };
  }

  // ניקוי נתונים ישנים
  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  // איפוס מונה למשתמש מסוים
  resetLimit(identifier: string): void {
    const key = this.generateKey(identifier);
    this.store.delete(key);
  }

  // קבלת מידע על Rate Limit
  getLimitInfo(identifier: string): RateLimitInfo | null {
    const key = this.generateKey(identifier);
    const current = this.store.get(key);
    
    if (!current) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: Date.now() + this.config.windowMs
      };
    }

    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      reset: current.resetTime
    };
  }

  // קבלת סטטיסטיקות
  getStats(): {
    totalKeys: number;
    totalRequests: number;
    activeWindows: number;
  } {
    let totalRequests = 0;
    const now = Date.now();
    let activeWindows = 0;

    for (const [key, data] of this.store.entries()) {
      totalRequests += data.count;
      if (data.resetTime > now) {
        activeWindows++;
      }
    }

    return {
      totalKeys: this.store.size,
      totalRequests,
      activeWindows
    };
  }
}

// יצירת Rate Limiters שונים
export const rateLimiters = {
  // Rate Limiter כללי
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 דקות
    maxRequests: 1000 // 1000 בקשות
  }),

  // Rate Limiter ל-API
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 דקות
    maxRequests: 100 // 100 בקשות
  }),

  // Rate Limiter להתחברות
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 דקות
    maxRequests: 5 // 5 ניסיונות התחברות
  }),

  // Rate Limiter לחיפוש
  search: new RateLimiter({
    windowMs: 60 * 1000, // דקה
    maxRequests: 30 // 30 חיפושים
  }),

  // Rate Limiter להעלאת קבצים
  upload: new RateLimiter({
    windowMs: 60 * 1000, // דקה
    maxRequests: 10 // 10 העלאות
  }),

  // Rate Limiter ל-WhatsApp
  whatsapp: new RateLimiter({
    windowMs: 60 * 1000, // דקה
    maxRequests: 20 // 20 הודעות
  })
};

// פונקציות עזר לזיהוי משתמשים
export const identifierUtils = {
  // זיהוי לפי IP
  getClientIP: (req: any): string => {
    return req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           req?.connection?.remoteAddress ||
           req?.socket?.remoteAddress ||
           req?.ip ||
           'unknown';
  },

  // זיהוי לפי User Agent
  getClientUserAgent: (req: any): string => {
    return req?.headers?.['user-agent'] || 'unknown';
  },

  // זיהוי לפי Session ID
  getSessionId: (req: any): string => {
    return req?.session?.id || req?.cookies?.sessionId || 'unknown';
  },

  // זיהוי לפי User ID
  getUserId: (req: any): string => {
    return req?.user?.id || req?.session?.userId || 'anonymous';
  },

  // יצירת מפתח ייחודי
  createIdentifier: (req: any, type: 'ip' | 'user' | 'session' | 'combined' = 'combined'): string => {
    switch (type) {
      case 'ip':
        return `ip:${identifierUtils.getClientIP(req)}`;
      case 'user':
        return `user:${identifierUtils.getUserId(req)}`;
      case 'session':
        return `session:${identifierUtils.getSessionId(req)}`;
      case 'combined':
      default:
        const ip = identifierUtils.getClientIP(req);
        const user = identifierUtils.getUserId(req);
        const session = identifierUtils.getSessionId(req);
        return `combined:${ip}:${user}:${session}`;
    }
  }
};

// Middleware ל-Rate Limiting
export const rateLimitMiddleware = (
  limiter: RateLimiter,
  identifierType: 'ip' | 'user' | 'session' | 'combined' = 'combined'
) => {
  return (req: any, res: any, next: any) => {
    const identifier = identifierUtils.createIdentifier(req, identifierType);
    const result = limiter.checkLimit(identifier);

    if (!result.allowed) {
      // הוספת headers
      res.set({
        'X-RateLimit-Limit': result.info.limit,
        'X-RateLimit-Remaining': result.info.remaining,
        'X-RateLimit-Reset': result.info.reset,
        'Retry-After': Math.ceil((result.retryAfter || 0) / 1000)
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
        retryAfter: Math.ceil((result.retryAfter || 0) / 1000)
      });
    }

    // הוספת headers לכל בקשה
    res.set({
      'X-RateLimit-Limit': result.info.limit,
      'X-RateLimit-Remaining': result.info.remaining,
      'X-RateLimit-Reset': result.info.reset
    });

    next();
  };
};

// פונקציות עזר לניהול Rate Limiting
export const rateLimitUtils = {
  // בדיקת Rate Limit
  checkRateLimit: (type: keyof typeof rateLimiters, identifier: string): RateLimitResult => {
    return rateLimiters[type].checkLimit(identifier);
  },

  // איפוס Rate Limit
  resetRateLimit: (type: keyof typeof rateLimiters, identifier: string): void => {
    rateLimiters[type].resetLimit(identifier);
  },

  // קבלת מידע על Rate Limit
  getRateLimitInfo: (type: keyof typeof rateLimiters, identifier: string): RateLimitInfo | null => {
    return rateLimiters[type].getLimitInfo(identifier);
  },

  // קבלת סטטיסטיקות
  getStats: () => {
    const stats: { [key: string]: any } = {};
    for (const [type, limiter] of Object.entries(rateLimiters)) {
      stats[type] = limiter.getStats();
    }
    return stats;
  },

  // יצירת Rate Limiter מותאם אישית
  createCustomLimiter: (config: RateLimitConfig): RateLimiter => {
    return new RateLimiter(config);
  }
};

// Hook ל-React לניהול Rate Limiting
export const useRateLimit = (type: keyof typeof rateLimiters) => {
  return {
    check: (identifier: string) => rateLimitUtils.checkRateLimit(type, identifier),
    reset: (identifier: string) => rateLimitUtils.resetRateLimit(type, identifier),
    getInfo: (identifier: string) => rateLimitUtils.getRateLimitInfo(type, identifier)
  };
};

// ניקוי אוטומטי של נתונים ישנים
export const startRateLimitCleanup = (interval: number = 5 * 60 * 1000) => {
  setInterval(() => {
    for (const limiter of Object.values(rateLimiters)) {
      // הניקוי מתבצע אוטומטית בכל בדיקה
      limiter.checkLimit('cleanup');
    }
  }, interval);
};

// ניקוי בעת טעינת הדף
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // שמירת סטטיסטיקות
    const stats = rateLimitUtils.getStats();
    sessionStorage.setItem('rate_limit_stats', JSON.stringify(stats));
  });
}

export default RateLimiter;
