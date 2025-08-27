// מערכת Cache לנתונים תכופים
// שימוש ב-LocalStorage ו-SessionStorage עם TTL (Time To Live)

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // זמן חיים במילישניות
  key: string;
}

export interface CacheOptions {
  ttl?: number; // זמן חיים במילישניות (ברירת מחדל: שעה)
  storage?: 'local' | 'session'; // סוג האחסון
  compress?: boolean; // האם לדחוס את הנתונים
}

export interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

class CacheManager {
  private storage: Storage;
  private prefix: string = 'slc_cache_';
  private stats: {
    hitCount: number;
    missCount: number;
  } = { hitCount: 0, missCount: 0 };

  constructor(storage: 'local' | 'session' = 'local') {
    this.storage = storage === 'local' ? localStorage : sessionStorage;
  }

  // יצירת מפתח cache
  private createKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // דחיסת נתונים
  private compress(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // דחיסה פשוטה - בפועל יש להשתמש בספריית דחיסה
      return btoa(jsonString);
    } catch (error) {
      console.warn('Failed to compress data:', error);
      return JSON.stringify(data);
    }
  }

  // פענוח נתונים
  private decompress(compressedData: string): any {
    try {
      // פענוח פשוט - בפועל יש להשתמש בספריית דחיסה
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to decompress data:', error);
      return JSON.parse(compressedData);
    }
  }

  // שמירת נתונים ב-cache
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    try {
      const {
        ttl = 60 * 60 * 1000, // שעה ברירת מחדל
        compress = false
      } = options;

      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        key
      };

      const serializedData = compress 
        ? this.compress(cacheItem)
        : JSON.stringify(cacheItem);

      this.storage.setItem(this.createKey(key), serializedData);
    } catch (error) {
      console.error('Error setting cache item:', error);
    }
  }

  // קבלת נתונים מ-cache
  get<T>(key: string, options: CacheOptions = {}): T | null {
    try {
      const { compress = false } = options;
      const cacheKey = this.createKey(key);
      const cachedData = this.storage.getItem(cacheKey);

      if (!cachedData) {
        this.stats.missCount++;
        return null;
      }

      const cacheItem: CacheItem<T> = compress
        ? this.decompress(cachedData)
        : JSON.parse(cachedData);

      // בדיקה אם הנתונים פגי תוקף
      if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
        this.remove(key);
        this.stats.missCount++;
        return null;
      }

      this.stats.hitCount++;
      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cache item:', error);
      this.stats.missCount++;
      return null;
    }
  }

  // בדיקה אם קיים ב-cache
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // מחיקת פריט מ-cache
  remove(key: string): void {
    try {
      this.storage.removeItem(this.createKey(key));
    } catch (error) {
      console.error('Error removing cache item:', error);
    }
  }

  // ניקוי כל ה-cache
  clear(): void {
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // ניקוי פריטים פגי תוקף
  cleanup(): number {
    let removedCount = 0;
    try {
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const cachedData = this.storage.getItem(key);
          if (cachedData) {
            try {
              const cacheItem: CacheItem = JSON.parse(cachedData);
              if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
                this.storage.removeItem(key);
                removedCount++;
              }
            } catch (error) {
              // אם יש שגיאה בפענוח, נמחק את הפריט
              this.storage.removeItem(key);
              removedCount++;
            }
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
    return removedCount;
  }

  // קבלת סטטיסטיקות
  getStats(): CacheStats {
    const keys = Object.keys(this.storage).filter(key => key.startsWith(this.prefix));
    let totalSize = 0;

    keys.forEach(key => {
      const data = this.storage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });

    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? (this.stats.hitCount / totalRequests) * 100 : 0;

    return {
      totalItems: keys.length,
      totalSize,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate
    };
  }

  // קבלת כל המפתחות
  keys(): string[] {
    const keys = Object.keys(this.storage).filter(key => key.startsWith(this.prefix));
    return keys.map(key => key.replace(this.prefix, ''));
  }

  // קבלת גודל cache
  size(): number {
    return this.keys().length;
  }
}

// יצירת instances של cache
export const localCache = new CacheManager('local');
export const sessionCache = new CacheManager('session');

// פונקציות עזר לניהול cache
export const cacheUtils = {
  // שמירת רשימת רכבים
  setCars: (cars: any[], ttl: number = 30 * 60 * 1000) => {
    localCache.set('cars', cars, { ttl });
  },

  // קבלת רשימת רכבים
  getCars: () => {
    return localCache.get<any[]>('cars');
  },

  // שמירת פרטי רכב
  setCar: (carId: string, car: any, ttl: number = 60 * 60 * 1000) => {
    localCache.set(`car_${carId}`, car, { ttl });
  },

  // קבלת פרטי רכב
  getCar: (carId: string) => {
    return localCache.get<any>(`car_${carId}`);
  },

  // שמירת תוצאות חיפוש
  setSearchResults: (query: string, results: any[], ttl: number = 15 * 60 * 1000) => {
    const searchKey = `search_${btoa(query)}`;
    localCache.set(searchKey, results, { ttl });
  },

  // קבלת תוצאות חיפוש
  getSearchResults: (query: string) => {
    const searchKey = `search_${btoa(query)}`;
    return localCache.get<any[]>(searchKey);
  },

  // שמירת הגדרות משתמש
  setUserSettings: (userId: string, settings: any) => {
    sessionCache.set(`user_settings_${userId}`, settings, { ttl: 24 * 60 * 60 * 1000 });
  },

  // קבלת הגדרות משתמש
  getUserSettings: (userId: string) => {
    return sessionCache.get<any>(`user_settings_${userId}`);
  },

  // שמירת תמונות
  setImage: (imageUrl: string, imageData: string, ttl: number = 24 * 60 * 60 * 1000) => {
    const imageKey = `image_${btoa(imageUrl)}`;
    localCache.set(imageKey, imageData, { ttl, compress: true });
  },

  // קבלת תמונה
  getImage: (imageUrl: string) => {
    const imageKey = `image_${btoa(imageUrl)}`;
    return localCache.get<string>(imageKey, { compress: true });
  },

  // שמירת API responses
  setApiResponse: (endpoint: string, params: any, response: any, ttl: number = 5 * 60 * 1000) => {
    const apiKey = `api_${btoa(endpoint)}_${btoa(JSON.stringify(params))}`;
    localCache.set(apiKey, response, { ttl });
  },

  // קבלת API response
  getApiResponse: (endpoint: string, params: any) => {
    const apiKey = `api_${btoa(endpoint)}_${btoa(JSON.stringify(params))}`;
    return localCache.get<any>(apiKey);
  }
};

// Hook ל-React לניהול cache
export const useCache = () => {
  return {
    // שמירה
    set: <T>(key: string, data: T, options?: CacheOptions) => {
      localCache.set(key, data, options);
    },

    // קבלה
    get: <T>(key: string, options?: CacheOptions): T | null => {
      return localCache.get<T>(key, options);
    },

    // בדיקה
    has: (key: string): boolean => {
      return localCache.has(key);
    },

    // מחיקה
    remove: (key: string) => {
      localCache.remove(key);
    },

    // ניקוי
    clear: () => {
      localCache.clear();
    },

    // סטטיסטיקות
    stats: localCache.getStats(),

    // ניקוי אוטומטי
    cleanup: () => {
      return localCache.cleanup();
    }
  };
};

// Middleware ל-API calls עם cache
export const withCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheKey: string,
  options: CacheOptions = {}
) => {
  return async (...args: T): Promise<R> => {
    // בדיקה אם יש ב-cache
    const cachedResult = localCache.get<R>(cacheKey, options);
    if (cachedResult !== null) {
      return cachedResult;
    }

    // קריאה לפונקציה המקורית
    const result = await fn(...args);

    // שמירה ב-cache
    localCache.set(cacheKey, result, options);

    return result;
  };
};

// ניקוי אוטומטי של cache
export const startCacheCleanup = (interval: number = 5 * 60 * 1000) => {
  setInterval(() => {
    const removedCount = localCache.cleanup();
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache items`);
    }
  }, interval);
};

// ניקוי cache בעת טעינת הדף
if (typeof window !== 'undefined') {
  // ניקוי cache ישן בעת טעינת הדף
  window.addEventListener('load', () => {
    localCache.cleanup();
    sessionCache.cleanup();
  });

  // ניקוי cache בעת סגירת הדף
  window.addEventListener('beforeunload', () => {
    // שמירת סטטיסטיקות
    const stats = localCache.getStats();
    sessionStorage.setItem('cache_stats', JSON.stringify(stats));
  });
}

export default CacheManager;
