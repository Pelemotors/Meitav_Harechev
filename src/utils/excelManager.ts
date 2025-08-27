// מערכת ייבוא/ייצוא Excel
// תמיכה בעמודת תיאור וניהול מלאי מתקדם

import { supabase } from './supabase';
import { Car, InventoryItem } from '../types';
import { inventoryManager } from './inventory';

export interface ExcelColumn {
  key: string;
  header: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array';
  validation?: (value: any) => boolean;
  transform?: (value: any) => any;
}

export interface ExcelImportResult {
  success: boolean;
  imported: number;
  errors: ExcelImportError[];
  warnings: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
}

export interface ExcelImportError {
  row: number;
  column: string;
  value: any;
  message: string;
  type: 'validation' | 'transformation' | 'database' | 'duplicate';
}

export interface ExcelExportOptions {
  format: 'xlsx' | 'csv';
  includeImages?: boolean;
  includeSEO?: boolean;
  includeInventory?: boolean;
  includeNotes?: boolean;
  filters?: any;
  columns?: string[];
  dateFormat?: string;
  numberFormat?: string;
}

export interface ExcelTemplate {
  name: string;
  description: string;
  columns: ExcelColumn[];
  sampleData: any[];
  validationRules: string[];
}

class ExcelManager {
  private readonly carColumns: ExcelColumn[] = [
    {
      key: 'name',
      header: 'שם הרכב',
      required: true,
      type: 'string',
      validation: (value) => value && value.length > 0
    },
    {
      key: 'brand',
      header: 'מותג',
      required: true,
      type: 'string',
      validation: (value) => value && value.length > 0
    },
    {
      key: 'model',
      header: 'מודל',
      required: true,
      type: 'string',
      validation: (value) => value && value.length > 0
    },
    {
      key: 'year',
      header: 'שנה',
      required: true,
      type: 'number',
      validation: (value) => value >= 1900 && value <= new Date().getFullYear() + 1
    },
    {
      key: 'price',
      header: 'מחיר',
      required: true,
      type: 'number',
      validation: (value) => value > 0
    },
    {
      key: 'kilometers',
      header: 'קילומטרים',
      required: true,
      type: 'number',
      validation: (value) => value >= 0
    },
    {
      key: 'mileage',
      header: 'קילומטראז\'',
      required: false,
      type: 'number',
      validation: (value) => !value || value >= 0
    },
    {
      key: 'transmission',
      header: 'תיבת הילוכים',
      required: true,
      type: 'string',
      validation: (value) => ['manual', 'automatic'].includes(value),
      transform: (value) => value?.toLowerCase()
    },
    {
      key: 'fuelType',
      header: 'סוג דלק',
      required: true,
      type: 'string',
      validation: (value) => ['gasoline', 'diesel', 'hybrid', 'electric'].includes(value),
      transform: (value) => value?.toLowerCase()
    },
    {
      key: 'color',
      header: 'צבע',
      required: true,
      type: 'string',
      validation: (value) => value && value.length > 0
    },
    {
      key: 'description',
      header: 'תיאור',
      required: true,
      type: 'string',
      validation: (value) => value && value.length > 10
    },
    {
      key: 'features',
      header: 'תכונות',
      required: false,
      type: 'array',
      transform: (value) => {
        if (typeof value === 'string') {
          return value.split(',').map(f => f.trim()).filter(f => f.length > 0);
        }
        return value || [];
      }
    },
    {
      key: 'condition',
      header: 'מצב',
      required: true,
      type: 'string',
      validation: (value) => ['new', 'used'].includes(value),
      transform: (value) => value?.toLowerCase()
    },
    {
      key: 'category',
      header: 'קטגוריה',
      required: false,
      type: 'string'
    },
    {
      key: 'keywords',
      header: 'מילות מפתח',
      required: false,
      type: 'array',
      transform: (value) => {
        if (typeof value === 'string') {
          return value.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        return value || [];
      }
    },
    {
      key: 'seoTitle',
      header: 'כותרת SEO',
      required: false,
      type: 'string'
    },
    {
      key: 'seoDescription',
      header: 'תיאור SEO',
      required: false,
      type: 'string'
    },
    {
      key: 'seoKeywords',
      header: 'מילות מפתח SEO',
      required: false,
      type: 'array',
      transform: (value) => {
        if (typeof value === 'string') {
          return value.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        return value || [];
      }
    },
    {
      key: 'inventoryStatus',
      header: 'סטטוס מלאי',
      required: false,
      type: 'string',
      validation: (value) => !value || ['in_stock', 'reserved', 'sold', 'maintenance', 'test_drive'].includes(value),
      transform: (value) => value || 'in_stock'
    },
    {
      key: 'stockQuantity',
      header: 'כמות במלאי',
      required: false,
      type: 'number',
      validation: (value) => !value || value >= 0,
      transform: (value) => value || 1
    },
    {
      key: 'costPrice',
      header: 'מחיר עלות',
      required: false,
      type: 'number',
      validation: (value) => !value || value >= 0
    },
    {
      key: 'markupPercentage',
      header: 'אחוז רווח',
      required: false,
      type: 'number',
      validation: (value) => !value || value >= 0,
      transform: (value) => value || 15
    },
    {
      key: 'conditionScore',
      header: 'ציון מצב',
      required: false,
      type: 'number',
      validation: (value) => !value || (value >= 1 && value <= 10),
      transform: (value) => value || 8
    },
    {
      key: 'tags',
      header: 'תגיות',
      required: false,
      type: 'array',
      transform: (value) => {
        if (typeof value === 'string') {
          return value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
        return value || [];
      }
    },
    {
      key: 'categories',
      header: 'קטגוריות',
      required: false,
      type: 'array',
      transform: (value) => {
        if (typeof value === 'string') {
          return value.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
        return value || [];
      }
    }
  ];

  // ייבוא קובץ Excel
  async importExcel(file: File, options: { updateExisting?: boolean; skipDuplicates?: boolean } = {}): Promise<ExcelImportResult> {
    try {
      const result: ExcelImportResult = {
        success: false,
        imported: 0,
        errors: [],
        warnings: [],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          skippedRows: 0
        }
      };

      // קריאת הקובץ
      const data = await this.readExcelFile(file);
      result.summary.totalRows = data.length;

      // עיבוד כל שורה
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 כי שורה 1 היא כותרות

        try {
          // אימות השורה
          const validationResult = this.validateRow(row, rowNumber);
          result.errors.push(...validationResult.errors);

          if (validationResult.errors.length > 0) {
            result.summary.invalidRows++;
            continue;
          }

          // טרנספורמציה של הנתונים
          const transformedData = this.transformRow(row);
          
          // בדיקת כפילויות
          if (options.skipDuplicates && await this.isDuplicate(transformedData)) {
            result.warnings.push(`שורה ${rowNumber}: רכב קיים במערכת - דילוג`);
            result.summary.skippedRows++;
            continue;
          }

          // שמירה במסד הנתונים
          if (options.updateExisting && await this.isDuplicate(transformedData)) {
            // עדכון רכב קיים
            const existingCar = await this.findExistingCar(transformedData);
            if (existingCar) {
              await inventoryManager.updateInventoryItem(existingCar.id, transformedData);
              result.imported++;
            }
          } else {
            // יצירת רכב חדש
            await inventoryManager.createInventoryItem(transformedData);
            result.imported++;
          }

          result.summary.validRows++;

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            column: 'general',
            value: null,
            message: error instanceof Error ? error.message : 'שגיאה לא ידועה',
            type: 'database'
          });
          result.summary.invalidRows++;
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [{
          row: 0,
          column: 'file',
          value: file.name,
          message: error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ',
          type: 'database'
        }],
        warnings: [],
        summary: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          skippedRows: 0
        }
      };
    }
  }

  // ייצוא לקובץ Excel
  async exportExcel(options: ExcelExportOptions = {}): Promise<Blob> {
    try {
      // קבלת נתונים
      const cars = await inventoryManager.getInventoryItems(options.filters);

      // הכנת נתונים לייצוא
      const exportData = cars.map(car => this.prepareCarForExport(car, options));

      // יצירת קובץ Excel
      if (options.format === 'xlsx') {
        return await this.createXLSXFile(exportData, options);
      } else {
        return await this.createCSVFile(exportData, options);
      }

    } catch (error) {
      console.error('שגיאה בייצוא Excel:', error);
      throw error;
    }
  }

  // יצירת תבנית Excel
  createTemplate(): ExcelTemplate {
    const sampleData = [
      {
        name: 'BMW X5 2023',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        price: 350000,
        kilometers: 15000,
        mileage: 15000,
        transmission: 'automatic',
        fuelType: 'gasoline',
        color: 'שחור',
        description: 'רכב יוקרה חדש במצב מעולה, עם כל התכונות המתקדמות. רכב משפחתי מרווח ונוח לנסיעה.',
        features: 'GPS, מצלמת רוורס, חבילות אוויר, מערכת בידוד קול',
        condition: 'new',
        category: 'רכבי יוקרה',
        keywords: 'BMW, X5, רכב חדש, יוקרה, משפחתי',
        seoTitle: 'BMW X5 2023 - רכב יוקרה חדש למכירה',
        seoDescription: 'BMW X5 2023 חדש במצב מעולה. רכב משפחתי מרווח עם כל התכונות המתקדמות.',
        seoKeywords: 'BMW X5, רכב חדש, יוקרה, משפחתי, למכירה',
        inventoryStatus: 'in_stock',
        stockQuantity: 1,
        costPrice: 300000,
        markupPercentage: 15,
        conditionScore: 9,
        tags: 'יוקרה, משפחתי, חדש',
        categories: 'רכבי יוקרה, רכבים משפחתיים'
      }
    ];

    const validationRules = [
      'כל השדות המסומנים ב-* הם חובה',
      'שנה חייבת להיות בין 1900 ל-2025',
      'מחיר חייב להיות מספר חיובי',
      'קילומטרים חייב להיות מספר לא שלילי',
      'תיבת הילוכים: manual או automatic',
      'סוג דלק: gasoline, diesel, hybrid, או electric',
      'מצב: new או used',
      'סטטוס מלאי: in_stock, reserved, sold, maintenance, או test_drive',
      'ציון מצב: מספר בין 1 ל-10',
      'תכונות, מילות מפתח, תגיות וקטגוריות: מופרדות בפסיקים'
    ];

    return {
      name: 'תבנית ייבוא רכבים',
      description: 'תבנית לייבוא רכבים למערכת Strong Luxury Cars',
      columns: this.carColumns,
      sampleData,
      validationRules
    };
  }

  // קריאת קובץ Excel
  private async readExcelFile(file: File): Promise<any[]> {
    // כאן תהיה קריאה אמיתית של קובץ Excel
    // כרגע נחזיר mock data
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        resolve(data);
      };
      reader.readAsText(file);
    });
  }

  // אימות שורה
  private validateRow(row: any, rowNumber: number): { errors: ExcelImportError[] } {
    const errors: ExcelImportError[] = [];

    for (const column of this.carColumns) {
      const value = row[column.header] || row[column.key];
      
      if (column.required && (!value || value.toString().trim() === '')) {
        errors.push({
          row: rowNumber,
          column: column.header,
          value: value,
          message: `שדה ${column.header} הוא חובה`,
          type: 'validation'
        });
        continue;
      }

      if (value && column.validation && !column.validation(value)) {
        errors.push({
          row: rowNumber,
          column: column.header,
          value: value,
          message: `ערך לא תקין בשדה ${column.header}`,
          type: 'validation'
        });
      }
    }

    return { errors };
  }

  // טרנספורמציה של שורה
  private transformRow(row: any): Partial<InventoryItem> {
    const transformed: any = {};

    for (const column of this.carColumns) {
      const value = row[column.header] || row[column.key];
      
      if (value !== undefined && value !== null && value !== '') {
        if (column.transform) {
          transformed[column.key] = column.transform(value);
        } else {
          transformed[column.key] = value;
        }
      }
    }

    return transformed;
  }

  // בדיקת כפילויות
  private async isDuplicate(data: Partial<InventoryItem>): Promise<boolean> {
    if (!data.name || !data.brand || !data.model || !data.year) return false;

    const { data: existing } = await supabase
      .from('cars')
      .select('id')
      .eq('name', data.name)
      .eq('brand', data.brand)
      .eq('model', data.model)
      .eq('year', data.year)
      .single();

    return !!existing;
  }

  // מציאת רכב קיים
  private async findExistingCar(data: Partial<InventoryItem>): Promise<Car | null> {
    if (!data.name || !data.brand || !data.model || !data.year) return null;

    const { data: existing } = await supabase
      .from('cars')
      .select('*')
      .eq('name', data.name)
      .eq('brand', data.brand)
      .eq('model', data.model)
      .eq('year', data.year)
      .single();

    return existing;
  }

  // הכנת רכב לייצוא
  private prepareCarForExport(car: InventoryItem, options: ExcelExportOptions): any {
    const exportData: any = {
      'שם הרכב': car.name,
      'מותג': car.brand,
      'מודל': car.model,
      'שנה': car.year,
      'מחיר': car.price,
      'קילומטרים': car.kilometers,
      'קילומטראז\'': car.mileage,
      'תיבת הילוכים': car.transmission,
      'סוג דלק': car.fuelType,
      'צבע': car.color,
      'תיאור': car.description,
      'תכונות': car.features?.join(', '),
      'מצב': car.condition,
      'קטגוריה': car.category
    };

    if (options.includeSEO) {
      exportData['כותרת SEO'] = car.seoTitle;
      exportData['תיאור SEO'] = car.seoDescription;
      exportData['מילות מפתח SEO'] = car.seoKeywords?.join(', ');
    }

    if (options.includeInventory) {
      exportData['סטטוס מלאי'] = car.inventoryStatus;
      exportData['כמות במלאי'] = car.stockQuantity;
      exportData['מחיר עלות'] = car.costPrice;
      exportData['אחוז רווח'] = car.markupPercentage;
      exportData['ציון מצב'] = car.conditionScore;
      exportData['תגיות'] = car.tags?.join(', ');
      exportData['קטגוריות'] = car.categories?.join(', ');
    }

    return exportData;
  }

  // יצירת קובץ XLSX
  private async createXLSXFile(data: any[], options: ExcelExportOptions): Promise<Blob> {
    // כאן תהיה יצירה אמיתית של קובץ XLSX
    // כרגע נחזיר CSV כ-Blob
    const csv = this.convertToCSV(data);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // יצירת קובץ CSV
  private async createCSVFile(data: any[], options: ExcelExportOptions): Promise<Blob> {
    const csv = this.convertToCSV(data);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // המרה ל-CSV
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  // ייצוא תבנית
  async exportTemplate(): Promise<Blob> {
    const template = this.createTemplate();
    const sampleData = template.sampleData;
    const csv = this.convertToCSV(sampleData);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // ייצוא דוח מלאי
  async exportInventoryReport(options: ExcelExportOptions = {}): Promise<Blob> {
    try {
      const stats = await inventoryManager.getInventoryStats();
      const cars = await inventoryManager.getInventoryItems(options.filters);

      const reportData = {
        summary: {
          'סה"כ רכבים': stats.totalItems,
          'במלאי': stats.inStock,
          'מוזמנים': stats.reserved,
          'נמכרו': stats.sold,
          'בתחזוקה': stats.maintenance,
          'נסיעת מבחן': stats.testDrive,
          'ערך כולל': stats.totalValue,
          'מחיר ממוצע': stats.averagePrice,
          'רווח כולל': stats.totalProfit,
          'רווח ממוצע': stats.averageProfitMargin
        },
        cars: cars.map(car => this.prepareCarForExport(car, options))
      };

      const csv = this.convertToCSV(reportData.cars);
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    } catch (error) {
      console.error('שגיאה בייצוא דוח מלאי:', error);
      throw error;
    }
  }
}

// יצירת instance גלובלי
export const excelManager = new ExcelManager();

// פונקציות עזר
export const excelUtils = {
  // ייבוא Excel
  import: (file: File, options?: { updateExisting?: boolean; skipDuplicates?: boolean }) => 
    excelManager.importExcel(file, options),

  // ייצוא Excel
  export: (options?: ExcelExportOptions) => excelManager.exportExcel(options),

  // יצירת תבנית
  createTemplate: () => excelManager.createTemplate(),

  // ייצוא תבנית
  exportTemplate: () => excelManager.exportTemplate(),

  // ייצוא דוח מלאי
  exportReport: (options?: ExcelExportOptions) => excelManager.exportInventoryReport(options)
};

// Hook ל-React לניהול Excel
export const useExcel = () => {
  return {
    import: excelUtils.import,
    export: excelUtils.export,
    createTemplate: excelUtils.createTemplate,
    exportTemplate: excelUtils.exportTemplate,
    exportReport: excelUtils.exportReport
  };
};

export default ExcelManager;
