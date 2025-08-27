// מערכת ניהול הגדרות מערכת
// ניהול הגדרות כלליות, SEO, WhatsApp, ועוד

import { supabase } from './supabase';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'general' | 'seo' | 'whatsapp' | 'email' | 'payment' | 'social' | 'security' | 'performance';
  description: string;
  isPublic: boolean;
  isRequired: boolean;
  validation?: string;
  defaultValue?: string;
  options?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  // הגדרות כלליות
  general: {
    companyName: string;
    companyPhone: string;
    companyEmail: string;
    companyAddress: string;
    businessHours: string;
    timezone: string;
    currency: string;
    language: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
  
  // הגדרות SEO
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
    googleAnalyticsId: string;
    googleTagManagerId: string;
    facebookPixelId: string;
    robotsTxt: string;
    sitemapUrl: string;
    canonicalDomain: string;
  };
  
  // הגדרות WhatsApp
  whatsapp: {
    enabled: boolean;
    phoneNumber: string;
    welcomeMessage: string;
    autoReply: boolean;
    autoReplyMessage: string;
    businessHours: string;
    offlineMessage: string;
    apiKey: string;
    webhookUrl: string;
  };
  
  // הגדרות אימייל
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    emailSignature: string;
    notificationsEnabled: boolean;
  };
  
  // הגדרות תשלום
  payment: {
    enabled: boolean;
    provider: string;
    apiKey: string;
    secretKey: string;
    webhookUrl: string;
    currency: string;
    taxRate: number;
    minimumAmount: number;
    maximumAmount: number;
  };
  
  // הגדרות רשתות חברתיות
  social: {
    facebookUrl: string;
    instagramUrl: string;
    twitterUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    tiktokUrl: string;
    shareButtons: boolean;
    socialLogin: boolean;
  };
  
  // הגדרות אבטחה
  security: {
    twoFactorEnabled: boolean;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sslRequired: boolean;
    corsOrigins: string[];
  };
  
  // הגדרות ביצועים
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    imageOptimization: boolean;
    lazyLoading: boolean;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    cdnUrl: string;
    maxUploadSize: number;
  };
}

class SystemSettingsManager {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 דקות

  // קבלת הגדרה
  async getSetting(key: string): Promise<string | null> {
    try {
      // בדיקת cache
      if (this.isCached(key)) {
        return this.getFromCache(key);
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // שמירה ב-cache
      this.setCache(key, data.value);
      return data.value;
    } catch (error) {
      console.error(`שגיאה בקבלת הגדרה ${key}:`, error);
      return null;
    }
  }

  // קבלת הגדרה עם טיפוס
  async getTypedSetting<T>(key: string, type: 'string' | 'number' | 'boolean' | 'json' | 'array'): Promise<T | null> {
    const value = await this.getSetting(key);
    if (value === null) return null;

    try {
      switch (type) {
        case 'string':
          return value as T;
        case 'number':
          return Number(value) as T;
        case 'boolean':
          return (value === 'true' || value === '1') as T;
        case 'json':
          return JSON.parse(value) as T;
        case 'array':
          return value.split(',').map(item => item.trim()) as T;
        default:
          return value as T;
      }
    } catch (error) {
      console.error(`שגיאה בהמרת הגדרה ${key}:`, error);
      return null;
    }
  }

  // קבלת כל ההגדרות
  async getAllSettings(): Promise<SystemSettings> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const settings: SystemSettings = {
        general: {
          companyName: '',
          companyPhone: '',
          companyEmail: '',
          companyAddress: '',
          businessHours: '',
          timezone: 'Asia/Jerusalem',
          currency: 'ILS',
          language: 'he',
          maintenanceMode: false,
          maintenanceMessage: ''
        },
        seo: {
          defaultTitle: 'Strong Luxury Cars - רכבי יוקרה למכירה',
          defaultDescription: 'רכבי יוקרה איכותיים ובדוקים במחירים תחרותיים',
          defaultKeywords: ['רכבי יוקרה', 'BMW', 'Mercedes', 'Audi'],
          googleAnalyticsId: '',
          googleTagManagerId: '',
          facebookPixelId: '',
          robotsTxt: '',
          sitemapUrl: '',
          canonicalDomain: ''
        },
        whatsapp: {
          enabled: false,
          phoneNumber: '',
          welcomeMessage: '',
          autoReply: false,
          autoReplyMessage: '',
          businessHours: '',
          offlineMessage: '',
          apiKey: '',
          webhookUrl: ''
        },
        email: {
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: '',
          replyToEmail: '',
          emailSignature: '',
          notificationsEnabled: true
        },
        payment: {
          enabled: false,
          provider: '',
          apiKey: '',
          secretKey: '',
          webhookUrl: '',
          currency: 'ILS',
          taxRate: 17,
          minimumAmount: 0,
          maximumAmount: 1000000
        },
        social: {
          facebookUrl: '',
          instagramUrl: '',
          twitterUrl: '',
          linkedinUrl: '',
          youtubeUrl: '',
          tiktokUrl: '',
          shareButtons: true,
          socialLogin: false
        },
        security: {
          twoFactorEnabled: false,
          passwordMinLength: 8,
          passwordRequireSpecial: true,
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          lockoutDuration: 900,
          sslRequired: true,
          corsOrigins: []
        },
        performance: {
          cacheEnabled: true,
          cacheDuration: 300,
          imageOptimization: true,
          lazyLoading: true,
          compressionEnabled: true,
          cdnEnabled: false,
          cdnUrl: '',
          maxUploadSize: 10485760
        }
      };

      // מיפוי הנתונים מהמסד
      data?.forEach(setting => {
        const value = this.parseSettingValue(setting.value, setting.type);
        this.setNestedValue(settings, setting.key, value);
      });

      return settings;
    } catch (error) {
      console.error('שגיאה בקבלת כל ההגדרות:', error);
      throw error;
    }
  }

  // עדכון הגדרה
  async updateSetting(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          updatedAt: new Date()
        })
        .eq('key', key);

      if (error) throw error;

      // ניקוי cache
      this.clearCache(key);
    } catch (error) {
      console.error(`שגיאה בעדכון הגדרה ${key}:`, error);
      throw error;
    }
  }

  // עדכון מספר הגדרות
  async updateMultipleSettings(updates: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(updates)) {
        await this.updateSetting(key, value);
      }
    } catch (error) {
      console.error('שגיאה בעדכון הגדרות מרובות:', error);
      throw error;
    }
  }

  // יצירת הגדרה חדשה
  async createSetting(setting: Partial<SystemSetting>): Promise<SystemSetting> {
    try {
      const systemSetting: Partial<SystemSetting> = {
        ...setting,
        value: setting.value || setting.defaultValue || '',
        type: setting.type || 'string',
        category: setting.category || 'general',
        isPublic: setting.isPublic ?? false,
        isRequired: setting.isRequired ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data, error } = await supabase
        .from('system_settings')
        .insert([systemSetting])
        .select()
        .single();

      if (error) throw error;

      return data as SystemSetting;
    } catch (error) {
      console.error('שגיאה ביצירת הגדרה:', error);
      throw error;
    }
  }

  // מחיקת הגדרה
  async deleteSetting(key: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .eq('key', key);

      if (error) throw error;

      // ניקוי cache
      this.clearCache(key);
    } catch (error) {
      console.error(`שגיאה במחיקת הגדרה ${key}:`, error);
      throw error;
    }
  }

  // איפוס הגדרות לברירת מחדל
  async resetToDefaults(): Promise<void> {
    try {
      const defaultSettings = this.getDefaultSettings();
      
      for (const setting of defaultSettings) {
        await this.createSetting(setting);
      }
    } catch (error) {
      console.error('שגיאה באיפוס הגדרות:', error);
      throw error;
    }
  }

  // יצירת הגדרות ברירת מחדל
  private getDefaultSettings(): Partial<SystemSetting>[] {
    return [
      {
        key: 'companyName',
        value: 'Strong Luxury Cars',
        type: 'string',
        category: 'general',
        description: 'שם החברה',
        isPublic: true,
        isRequired: true
      },
      {
        key: 'companyPhone',
        value: '050-1234567',
        type: 'string',
        category: 'general',
        description: 'טלפון החברה',
        isPublic: true,
        isRequired: true
      },
      {
        key: 'companyEmail',
        value: 'info@strongluxurycars.com',
        type: 'string',
        category: 'general',
        description: 'אימייל החברה',
        isPublic: true,
        isRequired: true
      },
      {
        key: 'defaultTitle',
        value: 'Strong Luxury Cars - רכבי יוקרה למכירה',
        type: 'string',
        category: 'seo',
        description: 'כותרת ברירת מחדל לאתר',
        isPublic: false,
        isRequired: true
      },
      {
        key: 'defaultDescription',
        value: 'רכבי יוקרה איכותיים ובדוקים במחירים תחרותיים',
        type: 'string',
        category: 'seo',
        description: 'תיאור ברירת מחדל לאתר',
        isPublic: false,
        isRequired: true
      },
      {
        key: 'whatsappEnabled',
        value: 'false',
        type: 'boolean',
        category: 'whatsapp',
        description: 'הפעלת אינטגרציית WhatsApp',
        isPublic: false,
        isRequired: false
      },
      {
        key: 'maintenanceMode',
        value: 'false',
        type: 'boolean',
        category: 'general',
        description: 'מצב תחזוקה',
        isPublic: false,
        isRequired: false
      }
    ];
  }

  // ניהול cache
  private isCached(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private getFromCache(key: string): any {
    return this.cache.get(key);
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private clearCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  // המרת ערך הגדרה
  private parseSettingValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'string':
          return value;
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true' || value === '1';
        case 'json':
          return JSON.parse(value);
        case 'array':
          return value.split(',').map(item => item.trim());
        default:
          return value;
      }
    } catch (error) {
      console.error('שגיאה בהמרת ערך הגדרה:', error);
      return value;
    }
  }

  // הגדרת ערך מקונן
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

// יצירת instance גלובלי
export const systemSettingsManager = new SystemSettingsManager();

// פונקציות עזר
export const systemSettingsUtils = {
  // קבלת הגדרה
  get: (key: string) => systemSettingsManager.getSetting(key),

  // קבלת הגדרה עם טיפוס
  getTyped: <T>(key: string, type: 'string' | 'number' | 'boolean' | 'json' | 'array') => 
    systemSettingsManager.getTypedSetting<T>(key, type),

  // קבלת כל ההגדרות
  getAll: () => systemSettingsManager.getAllSettings(),

  // עדכון הגדרה
  update: (key: string, value: any) => systemSettingsManager.updateSetting(key, value),

  // עדכון הגדרות מרובות
  updateMultiple: (updates: Record<string, any>) => systemSettingsManager.updateMultipleSettings(updates),

  // יצירת הגדרה
  create: (setting: Partial<SystemSetting>) => systemSettingsManager.createSetting(setting),

  // מחיקת הגדרה
  delete: (key: string) => systemSettingsManager.deleteSetting(key),

  // איפוס לברירת מחדל
  reset: () => systemSettingsManager.resetToDefaults()
};

// Hook ל-React לניהול הגדרות מערכת
export const useSystemSettings = () => {
  return {
    get: systemSettingsUtils.get,
    getTyped: systemSettingsUtils.getTyped,
    getAll: systemSettingsUtils.getAll,
    update: systemSettingsUtils.update,
    updateMultiple: systemSettingsUtils.updateMultiple,
    create: systemSettingsUtils.create,
    delete: systemSettingsUtils.delete,
    reset: systemSettingsUtils.reset
  };
};

export default SystemSettingsManager;
