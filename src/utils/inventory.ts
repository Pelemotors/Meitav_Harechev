// מערכת ניהול מלאי מתקדמת
// תמיכה בתיאור חופשי, מילות מפתח, וניהול מלאי מתקדם

import { supabase } from './supabase';
import { Car } from '../types';
import { seoOptimizer, seoUtils } from './seoOptimizer';

export interface InventoryItem extends Car {
  // שדות חדשים לניהול מלאי
  description: string; // תיאור חופשי מפורט
  keywords: string[]; // מילות מפתח לחיפוש
  seoTitle?: string; // כותרת מותאמת ל-SEO
  seoDescription?: string; // תיאור מותאם ל-SEO
  seoKeywords?: string[]; // מילות מפתח ל-SEO
  inventoryStatus: 'in_stock' | 'reserved' | 'sold' | 'maintenance' | 'test_drive';
  stockQuantity: number; // כמות במלאי (רלוונטי לרכבים זהים)
  reservedUntil?: Date; // תאריך הזמנה
  maintenanceNotes?: string; // הערות תחזוקה
  testDriveSchedule?: Date[]; // לוח נסיעות מבחן
  lastUpdated: Date;
  lastInventoryCheck: Date;
  nextMaintenanceDate?: Date;
  warrantyExpiry?: Date;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
  costPrice: number; // מחיר עלות
  markupPercentage: number; // אחוז רווח
  profitMargin: number; // רווח נקי
  depreciationRate: number; // אחוז פחת
  marketValue: number; // ערך שוק נוכחי
  conditionScore: number; // ציון מצב (1-10)
  photosCount: number; // מספר תמונות
  videosCount: number; // מספר סרטונים
  documentsCount: number; // מספר מסמכים
  viewsCount: number; // מספר צפיות
  inquiriesCount: number; // מספר פניות
  favoritesCount: number; // מספר מועדפים
  tags: string[]; // תגיות נוספות
  categories: string[]; // קטגוריות
  features: string[]; // תכונות מיוחדות
  specifications: Record<string, any>; // מפרט טכני מורחב
  history: InventoryHistoryItem[]; // היסטוריית מלאי
  notes: InventoryNote[]; // הערות פנימיות
}

export interface InventoryHistoryItem {
  id: string;
  itemId: string;
  action: 'created' | 'updated' | 'status_changed' | 'price_changed' | 'maintenance' | 'test_drive' | 'reserved' | 'sold';
  previousValue?: any;
  newValue?: any;
  notes?: string;
  userId: string;
  userEmail: string;
  timestamp: Date;
}

export interface InventoryNote {
  id: string;
  itemId: string;
  type: 'general' | 'maintenance' | 'customer' | 'financial' | 'marketing' | 'technical';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPrivate: boolean; // הערה פרטית או ציבורית
  userId: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryFilter {
  status?: string[];
  brand?: string[];
  model?: string[];
  year?: number[];
  priceRange?: { min: number; max: number };
  conditionScore?: number[];
  keywords?: string[];
  tags?: string[];
  categories?: string[];
  features?: string[];
  inStock?: boolean;
  hasWarranty?: boolean;
  needsMaintenance?: boolean;
  availableForTestDrive?: boolean;
}

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  reserved: number;
  sold: number;
  maintenance: number;
  testDrive: number;
  totalValue: number;
  averagePrice: number;
  totalProfit: number;
  averageProfitMargin: number;
  itemsNeedingMaintenance: number;
  itemsExpiringWarranty: number;
  itemsExpiringInsurance: number;
  itemsExpiringRegistration: number;
  topViewedItems: InventoryItem[];
  topInquiredItems: InventoryItem[];
  lowStockItems: InventoryItem[];
  highProfitItems: InventoryItem[];
}

class InventoryManager {
  // יצירת פריט מלאי חדש
  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      // יצירת מילות מפתח אוטומטיות
      const autoKeywords = this.generateAutoKeywords(item);
      const finalKeywords = [...(item.keywords || []), ...autoKeywords];

      // יצירת תיאור SEO אוטומטי
      const seoData = this.generateSEOData(item, finalKeywords);

      const inventoryItem: Partial<InventoryItem> = {
        ...item,
        keywords: finalKeywords,
        seoTitle: item.seoTitle || seoData.title,
        seoDescription: item.seoDescription || seoData.description,
        seoKeywords: item.seoKeywords || finalKeywords,
        inventoryStatus: item.inventoryStatus || 'in_stock',
        stockQuantity: item.stockQuantity || 1,
        lastUpdated: new Date(),
        lastInventoryCheck: new Date(),
        markupPercentage: item.markupPercentage || 15,
        depreciationRate: item.depreciationRate || 10,
        conditionScore: item.conditionScore || 8,
        photosCount: item.photosCount || 0,
        videosCount: item.videosCount || 0,
        documentsCount: item.documentsCount || 0,
        viewsCount: item.viewsCount || 0,
        inquiriesCount: item.inquiriesCount || 0,
        favoritesCount: item.favoritesCount || 0,
        tags: item.tags || [],
        categories: item.categories || [],
        features: item.features || [],
        specifications: item.specifications || {},
        history: [],
        notes: []
      };

      // חישוב רווח
      if (inventoryItem.costPrice && inventoryItem.price) {
        inventoryItem.profitMargin = inventoryItem.price - inventoryItem.costPrice;
        inventoryItem.marketValue = this.calculateMarketValue(inventoryItem);
      }

      const { data, error } = await supabase
        .from('cars')
        .insert([inventoryItem])
        .select()
        .single();

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(data.id, 'created', undefined, inventoryItem, 'פריט מלאי נוצר');

      // עדכון SEO
      await this.updateSEOForItem(data);

      return data as InventoryItem;
    } catch (error) {
      console.error('שגיאה ביצירת פריט מלאי:', error);
      throw error;
    }
  }

  // עדכון פריט מלאי
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      // קבלת הפריט הנוכחי
      const { data: currentItem } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (!currentItem) throw new Error('פריט לא נמצא');

      // עדכון מילות מפתח
      if (updates.keywords) {
        const autoKeywords = this.generateAutoKeywords(updates);
        updates.keywords = [...updates.keywords, ...autoKeywords];
      }

      // עדכון SEO
      if (updates.description || updates.keywords) {
        const seoData = this.generateSEOData(updates, updates.keywords || currentItem.keywords);
        updates.seoTitle = updates.seoTitle || seoData.title;
        updates.seoDescription = updates.seoDescription || seoData.description;
        updates.seoKeywords = updates.seoKeywords || seoData.keywords;
      }

      // חישוב רווח מעודכן
      if (updates.costPrice || updates.price) {
        const newCostPrice = updates.costPrice || currentItem.costPrice;
        const newPrice = updates.price || currentItem.price;
        if (newCostPrice && newPrice) {
          updates.profitMargin = newPrice - newCostPrice;
          updates.marketValue = this.calculateMarketValue({ ...currentItem, ...updates });
        }
      }

      updates.lastUpdated = new Date();

      const { data, error } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(id, 'updated', currentItem, updates, 'פריט מלאי עודכן');

      // עדכון SEO
      await this.updateSEOForItem(data);

      return data as InventoryItem;
    } catch (error) {
      console.error('שגיאה בעדכון פריט מלאי:', error);
      throw error;
    }
  }

  // מחיקת פריט מלאי
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(id, 'deleted', undefined, undefined, 'פריט מלאי נמחק');
    } catch (error) {
      console.error('שגיאה במחיקת פריט מלאי:', error);
      throw error;
    }
  }

  // קבלת פריטי מלאי עם סינון
  async getInventoryItems(filter: InventoryFilter = {}): Promise<InventoryItem[]> {
    try {
      let query = supabase
        .from('cars')
        .select('*')
        .order('lastUpdated', { ascending: false });

      // סינון לפי סטטוס
      if (filter.status && filter.status.length > 0) {
        query = query.in('inventoryStatus', filter.status);
      }

      // סינון לפי מותג
      if (filter.brand && filter.brand.length > 0) {
        query = query.in('brand', filter.brand);
      }

      // סינון לפי מודל
      if (filter.model && filter.model.length > 0) {
        query = query.in('model', filter.model);
      }

      // סינון לפי שנה
      if (filter.year && filter.year.length > 0) {
        query = query.in('year', filter.year);
      }

      // סינון לפי טווח מחיר
      if (filter.priceRange) {
        if (filter.priceRange.min !== undefined) {
          query = query.gte('price', filter.priceRange.min);
        }
        if (filter.priceRange.max !== undefined) {
          query = query.lte('price', filter.priceRange.max);
        }
      }

      // סינון לפי מילות מפתח
      if (filter.keywords && filter.keywords.length > 0) {
        const keywordConditions = filter.keywords.map(keyword => 
          `keywords.cs.{${keyword}}`
        );
        query = query.or(keywordConditions.join(','));
      }

      // סינון לפי תגיות
      if (filter.tags && filter.tags.length > 0) {
        const tagConditions = filter.tags.map(tag => 
          `tags.cs.{${tag}}`
        );
        query = query.or(tagConditions.join(','));
      }

      // סינון לפי מלאי
      if (filter.inStock !== undefined) {
        if (filter.inStock) {
          query = query.eq('inventoryStatus', 'in_stock');
        } else {
          query = query.neq('inventoryStatus', 'in_stock');
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as InventoryItem[];
    } catch (error) {
      console.error('שגיאה בקבלת פריטי מלאי:', error);
      throw error;
    }
  }

  // קבלת סטטיסטיקות מלאי
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const { data: items } = await supabase
        .from('cars')
        .select('*');

      if (!items) return this.getEmptyStats();

      const stats: InventoryStats = {
        totalItems: items.length,
        inStock: items.filter(item => item.inventoryStatus === 'in_stock').length,
        reserved: items.filter(item => item.inventoryStatus === 'reserved').length,
        sold: items.filter(item => item.inventoryStatus === 'sold').length,
        maintenance: items.filter(item => item.inventoryStatus === 'maintenance').length,
        testDrive: items.filter(item => item.inventoryStatus === 'test_drive').length,
        totalValue: items.reduce((sum, item) => sum + (item.price || 0), 0),
        averagePrice: items.reduce((sum, item) => sum + (item.price || 0), 0) / items.length,
        totalProfit: items.reduce((sum, item) => sum + (item.profitMargin || 0), 0),
        averageProfitMargin: items.reduce((sum, item) => sum + (item.profitMargin || 0), 0) / items.length,
        itemsNeedingMaintenance: items.filter(item => 
          item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= new Date()
        ).length,
        itemsExpiringWarranty: items.filter(item => 
          item.warrantyExpiry && new Date(item.warrantyExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        itemsExpiringInsurance: items.filter(item => 
          item.insuranceExpiry && new Date(item.insuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        itemsExpiringRegistration: items.filter(item => 
          item.registrationExpiry && new Date(item.registrationExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length,
        topViewedItems: items
          .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
          .slice(0, 5) as InventoryItem[],
        topInquiredItems: items
          .sort((a, b) => (b.inquiriesCount || 0) - (a.inquiriesCount || 0))
          .slice(0, 5) as InventoryItem[],
        lowStockItems: items
          .filter(item => (item.stockQuantity || 0) <= 1)
          .slice(0, 5) as InventoryItem[],
        highProfitItems: items
          .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
          .slice(0, 5) as InventoryItem[]
      };

      return stats;
    } catch (error) {
      console.error('שגיאה בקבלת סטטיסטיקות מלאי:', error);
      return this.getEmptyStats();
    }
  }

  // הוספת הערה לפריט
  async addInventoryNote(itemId: string, note: Partial<InventoryNote>): Promise<InventoryNote> {
    try {
      const { data, error } = await supabase
        .from('inventory_notes')
        .insert([{
          itemId,
          type: note.type || 'general',
          title: note.title,
          content: note.content,
          priority: note.priority || 'medium',
          isPrivate: note.isPrivate || false,
          userId: note.userId,
          userEmail: note.userEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      return data as InventoryNote;
    } catch (error) {
      console.error('שגיאה בהוספת הערת מלאי:', error);
      throw error;
    }
  }

  // קבלת הערות פריט
  async getInventoryNotes(itemId: string, includePrivate: boolean = false): Promise<InventoryNote[]> {
    try {
      let query = supabase
        .from('inventory_notes')
        .select('*')
        .eq('itemId', itemId)
        .order('createdAt', { ascending: false });

      if (!includePrivate) {
        query = query.eq('isPrivate', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as InventoryNote[];
    } catch (error) {
      console.error('שגיאה בקבלת הערות מלאי:', error);
      throw error;
    }
  }

  // עדכון סטטוס מלאי
  async updateInventoryStatus(itemId: string, status: string, notes?: string): Promise<void> {
    try {
      const { data: currentItem } = await supabase
        .from('cars')
        .select('inventoryStatus')
        .eq('id', itemId)
        .single();

      if (!currentItem) throw new Error('פריט לא נמצא');

      const { error } = await supabase
        .from('cars')
        .update({ 
          inventoryStatus: status,
          lastUpdated: new Date()
        })
        .eq('id', itemId);

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(
        itemId, 
        'status_changed', 
        currentItem.inventoryStatus, 
        status, 
        notes || `סטטוס מלאי השתנה ל-${status}`
      );
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס מלאי:', error);
      throw error;
    }
  }

  // הזמנת פריט
  async reserveItem(itemId: string, reservedUntil: Date, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          inventoryStatus: 'reserved',
          reservedUntil,
          lastUpdated: new Date()
        })
        .eq('id', itemId);

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(
        itemId, 
        'reserved', 
        undefined, 
        { reservedUntil }, 
        notes || 'פריט הוזמן'
      );
    } catch (error) {
      console.error('שגיאה בהזמנת פריט:', error);
      throw error;
    }
  }

  // ביטול הזמנה
  async cancelReservation(itemId: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          inventoryStatus: 'in_stock',
          reservedUntil: null,
          lastUpdated: new Date()
        })
        .eq('id', itemId);

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(
        itemId, 
        'status_changed', 
        'reserved', 
        'in_stock', 
        notes || 'הזמנה בוטלה'
      );
    } catch (error) {
      console.error('שגיאה בביטול הזמנה:', error);
      throw error;
    }
  }

  // מכירת פריט
  async sellItem(itemId: string, salePrice: number, notes?: string): Promise<void> {
    try {
      const { data: currentItem } = await supabase
        .from('cars')
        .select('price, costPrice')
        .eq('id', itemId)
        .single();

      if (!currentItem) throw new Error('פריט לא נמצא');

      const profitMargin = salePrice - (currentItem.costPrice || 0);

      const { error } = await supabase
        .from('cars')
        .update({ 
          inventoryStatus: 'sold',
          price: salePrice,
          profitMargin,
          lastUpdated: new Date()
        })
        .eq('id', itemId);

      if (error) throw error;

      // הוספת רשומה להיסטוריה
      await this.addHistoryRecord(
        itemId, 
        'sold', 
        { price: currentItem.price }, 
        { price: salePrice, profitMargin }, 
        notes || `פריט נמכר במחיר ${salePrice}`
      );
    } catch (error) {
      console.error('שגיאה במכירת פריט:', error);
      throw error;
    }
  }

  // עדכון צפיות
  async incrementViews(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          viewsCount: supabase.rpc('increment', { row_id: itemId, column_name: 'viewsCount' })
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('שגיאה בעדכון צפיות:', error);
    }
  }

  // עדכון פניות
  async incrementInquiries(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          inquiriesCount: supabase.rpc('increment', { row_id: itemId, column_name: 'inquiriesCount' })
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('שגיאה בעדכון פניות:', error);
    }
  }

  // עדכון מועדפים
  async incrementFavorites(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ 
          favoritesCount: supabase.rpc('increment', { row_id: itemId, column_name: 'favoritesCount' })
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('שגיאה בעדכון מועדפים:', error);
    }
  }

  // יצירת מילות מפתח אוטומטיות
  private generateAutoKeywords(item: Partial<InventoryItem>): string[] {
    const keywords: string[] = [];

    if (item.brand) keywords.push(item.brand);
    if (item.model) keywords.push(item.model);
    if (item.year) keywords.push(item.year.toString());
    if (item.condition) keywords.push(item.condition === 'new' ? 'חדש' : 'משומש');
    if (item.transmission) keywords.push(item.transmission === 'automatic' ? 'אוטומטי' : 'ידני');
    if (item.fuelType) keywords.push(item.fuelType);
    if (item.color) keywords.push(item.color);

    // הוספת מילות מפתח כלליות
    keywords.push('רכב', 'רכבי יוקרה', 'Strong Luxury Cars');

    return [...new Set(keywords)]; // הסרת כפילויות
  }

  // יצירת נתוני SEO
  private generateSEOData(item: Partial<InventoryItem>, keywords: string[]) {
    const price = item.price ? new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(item.price) : '';

    const title = `${item.name || ''} ${item.year || ''} - ${price} | Strong Luxury Cars`;
    const description = `${item.description || ''} רכב ${item.condition === 'new' ? 'חדש' : 'משומש'} במחיר ${price}. רכבי יוקרה איכותיים ובדוקים.`;

    return {
      title,
      description,
      keywords
    };
  }

  // חישוב ערך שוק
  private calculateMarketValue(item: Partial<InventoryItem>): number {
    if (!item.price || !item.depreciationRate) return item.price || 0;

    const ageInYears = item.year ? new Date().getFullYear() - item.year : 0;
    const depreciation = (item.price * item.depreciationRate * ageInYears) / 100;
    
    return Math.max(item.price - depreciation, item.price * 0.3); // מינימום 30% מהמחיר המקורי
  }

  // הוספת רשומה להיסטוריה
  private async addHistoryRecord(
    itemId: string, 
    action: string, 
    previousValue: any, 
    newValue: any, 
    notes: string
  ): Promise<void> {
    try {
      // כאן תהיה הוספה לטבלת היסטוריה
      // כרגע נשמור ב-localStorage
      const history = JSON.parse(localStorage.getItem('inventory_history') || '[]');
      history.push({
        id: Date.now().toString(),
        itemId,
        action,
        previousValue,
        newValue,
        notes,
        userId: 'system',
        userEmail: 'system@strongluxurycars.com',
        timestamp: new Date()
      });
      localStorage.setItem('inventory_history', JSON.stringify(history));
    } catch (error) {
      console.error('שגיאה בהוספת רשומת היסטוריה:', error);
    }
  }

  // עדכון SEO לפריט
  private async updateSEOForItem(item: InventoryItem): Promise<void> {
    try {
      const seoData = {
        title: item.seoTitle || item.name,
        description: item.seoDescription || item.description,
        keywords: item.seoKeywords || item.keywords,
        url: `/car/${item.id}`,
        images: item.images || []
      };

      // עדכון Meta tags
      seoUtils.updateMeta(seoData);

      // הוספת Schema markup
      const schema = seoOptimizer.generateCarSchema({
        id: item.id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        year: item.year,
        price: item.price,
        description: item.description,
        images: item.images,
        url: seoData.url,
        category: item.category,
        condition: item.condition,
        mileage: item.mileage,
        fuelType: item.fuelType,
        transmission: item.transmission,
        color: item.color
      });

      seoOptimizer.addSchemaMarkup(schema);
    } catch (error) {
      console.error('שגיאה בעדכון SEO:', error);
    }
  }

  // סטטיסטיקות ריקות
  private getEmptyStats(): InventoryStats {
    return {
      totalItems: 0,
      inStock: 0,
      reserved: 0,
      sold: 0,
      maintenance: 0,
      testDrive: 0,
      totalValue: 0,
      averagePrice: 0,
      totalProfit: 0,
      averageProfitMargin: 0,
      itemsNeedingMaintenance: 0,
      itemsExpiringWarranty: 0,
      itemsExpiringInsurance: 0,
      itemsExpiringRegistration: 0,
      topViewedItems: [],
      topInquiredItems: [],
      lowStockItems: [],
      highProfitItems: []
    };
  }
}

// יצירת instance גלובלי
export const inventoryManager = new InventoryManager();

// פונקציות עזר
export const inventoryUtils = {
  // יצירת פריט מלאי
  createItem: (item: Partial<InventoryItem>) => inventoryManager.createInventoryItem(item),

  // עדכון פריט מלאי
  updateItem: (id: string, updates: Partial<InventoryItem>) => inventoryManager.updateInventoryItem(id, updates),

  // מחיקת פריט מלאי
  deleteItem: (id: string) => inventoryManager.deleteInventoryItem(id),

  // קבלת פריטי מלאי
  getItems: (filter?: InventoryFilter) => inventoryManager.getInventoryItems(filter),

  // קבלת סטטיסטיקות
  getStats: () => inventoryManager.getInventoryStats(),

  // הוספת הערה
  addNote: (itemId: string, note: Partial<InventoryNote>) => inventoryManager.addInventoryNote(itemId, note),

  // קבלת הערות
  getNotes: (itemId: string, includePrivate?: boolean) => inventoryManager.getInventoryNotes(itemId, includePrivate),

  // עדכון סטטוס
  updateStatus: (itemId: string, status: string, notes?: string) => inventoryManager.updateInventoryStatus(itemId, status, notes),

  // הזמנת פריט
  reserveItem: (itemId: string, reservedUntil: Date, notes?: string) => inventoryManager.reserveItem(itemId, reservedUntil, notes),

  // ביטול הזמנה
  cancelReservation: (itemId: string, notes?: string) => inventoryManager.cancelReservation(itemId, notes),

  // מכירת פריט
  sellItem: (itemId: string, salePrice: number, notes?: string) => inventoryManager.sellItem(itemId, salePrice, notes),

  // עדכון צפיות
  incrementViews: (itemId: string) => inventoryManager.incrementViews(itemId),

  // עדכון פניות
  incrementInquiries: (itemId: string) => inventoryManager.incrementInquiries(itemId),

  // עדכון מועדפים
  incrementFavorites: (itemId: string) => inventoryManager.incrementFavorites(itemId)
};

// Hook ל-React לניהול מלאי
export const useInventory = () => {
  return {
    createItem: inventoryUtils.createItem,
    updateItem: inventoryUtils.updateItem,
    deleteItem: inventoryUtils.deleteItem,
    getItems: inventoryUtils.getItems,
    getStats: inventoryUtils.getStats,
    addNote: inventoryUtils.addNote,
    getNotes: inventoryUtils.getNotes,
    updateStatus: inventoryUtils.updateStatus,
    reserveItem: inventoryUtils.reserveItem,
    cancelReservation: inventoryUtils.cancelReservation,
    sellItem: inventoryUtils.sellItem,
    incrementViews: inventoryUtils.incrementViews,
    incrementInquiries: inventoryUtils.incrementInquiries,
    incrementFavorites: inventoryUtils.incrementFavorites
  };
};

export default InventoryManager;
