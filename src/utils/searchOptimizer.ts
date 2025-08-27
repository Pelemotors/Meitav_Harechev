// מערכת אופטימיזציה לביצועי חיפוש
// שימוש ב-Indexing, Caching ו-Debouncing

import { Car } from '../types';
import { localCache, cacheUtils } from './cache';

export interface SearchIndex {
  [key: string]: {
    cars: string[]; // IDs of cars
    count: number;
  };
}

export interface SearchOptimizationOptions {
  enableCache?: boolean;
  enableIndexing?: boolean;
  enableDebouncing?: boolean;
  debounceDelay?: number;
  maxResults?: number;
  minQueryLength?: number;
}

export interface SearchResult {
  cars: Car[];
  total: number;
  query: string;
  executionTime: number;
  fromCache: boolean;
}

class SearchOptimizer {
  private searchIndex: SearchIndex = {};
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private options: SearchOptimizationOptions;

  constructor(options: SearchOptimizationOptions = {}) {
    this.options = {
      enableCache: true,
      enableIndexing: true,
      enableDebouncing: true,
      debounceDelay: 300,
      maxResults: 50,
      minQueryLength: 2,
      ...options
    };
  }

  // יצירת אינדקס חיפוש
  buildSearchIndex(cars: Car[]): void {
    if (!this.options.enableIndexing) return;

    this.searchIndex = {};

    cars.forEach(car => {
      // יצירת מפתחות חיפוש
      const searchKeys = this.generateSearchKeys(car);
      
      searchKeys.forEach(key => {
        if (!this.searchIndex[key]) {
          this.searchIndex[key] = { cars: [], count: 0 };
        }
        
        if (!this.searchIndex[key].cars.includes(car.id)) {
          this.searchIndex[key].cars.push(car.id);
          this.searchIndex[key].count++;
        }
      });
    });

    // שמירת האינדקס ב-cache
    if (this.options.enableCache) {
      cacheUtils.setSearchIndex(this.searchIndex);
    }
  }

  // יצירת מפתחות חיפוש מרכב
  private generateSearchKeys(car: Car): string[] {
    const keys: string[] = [];
    
    // מפתחות בסיסיים
    keys.push(car.name.toLowerCase());
    keys.push(car.brand.toLowerCase());
    keys.push(car.model.toLowerCase());
    keys.push(car.color.toLowerCase());
    
    // מפתחות מספריים
    keys.push(car.year.toString());
    keys.push(car.price.toString());
    keys.push(car.kilometers.toString());
    
    // מפתחות מורכבים
    keys.push(`${car.brand} ${car.model}`.toLowerCase());
    keys.push(`${car.year} ${car.brand}`.toLowerCase());
    keys.push(`${car.transmission} ${car.fuelType}`.toLowerCase());
    
    // מפתחות חלקיים
    const words = car.name.split(' ');
    words.forEach(word => {
      if (word.length >= 2) {
        keys.push(word.toLowerCase());
      }
    });

    // מפתחות תכונות
    car.features.forEach(feature => {
      keys.push(feature.toLowerCase());
    });

    return keys;
  }

  // חיפוש מהיר באמצעות אינדקס
  private searchWithIndex(query: string, cars: Car[]): Car[] {
    if (!this.options.enableIndexing || !this.searchIndex) {
      return this.searchWithoutIndex(query, cars);
    }

    const queryLower = query.toLowerCase();
    const matchingCarIds = new Set<string>();

    // חיפוש במפתחות האינדקס
    Object.keys(this.searchIndex).forEach(key => {
      if (key.includes(queryLower)) {
        this.searchIndex[key].cars.forEach(carId => {
          matchingCarIds.add(carId);
        });
      }
    });

    // החזרת הרכבים המתאימים
    return cars.filter(car => matchingCarIds.has(car.id));
  }

  // חיפוש רגיל ללא אינדקס
  private searchWithoutIndex(query: string, cars: Car[]): Car[] {
    const queryLower = query.toLowerCase();
    
    return cars.filter(car => {
      return (
        car.name.toLowerCase().includes(queryLower) ||
        car.brand.toLowerCase().includes(queryLower) ||
        car.model.toLowerCase().includes(queryLower) ||
        car.color.toLowerCase().includes(queryLower) ||
        car.description.toLowerCase().includes(queryLower) ||
        car.features.some(feature => feature.toLowerCase().includes(queryLower)) ||
        car.year.toString().includes(queryLower) ||
        car.price.toString().includes(queryLower) ||
        car.kilometers.toString().includes(queryLower)
      );
    });
  }

  // חיפוש עם אופטימיזציה
  async search(
    query: string, 
    cars: Car[], 
    options: SearchOptimizationOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };

    // בדיקת אורך מינימלי
    if (query.length < (mergedOptions.minQueryLength || 2)) {
      return {
        cars: [],
        total: 0,
        query,
        executionTime: Date.now() - startTime,
        fromCache: false
      };
    }

    // בדיקה ב-cache
    if (mergedOptions.enableCache) {
      const cachedResult = cacheUtils.getSearchResults(query);
      if (cachedResult) {
        return {
          cars: cachedResult.slice(0, mergedOptions.maxResults || 50),
          total: cachedResult.length,
          query,
          executionTime: Date.now() - startTime,
          fromCache: true
        };
      }
    }

    // ביצוע החיפוש
    let results: Car[];
    
    if (mergedOptions.enableIndexing) {
      results = this.searchWithIndex(query, cars);
    } else {
      results = this.searchWithoutIndex(query, cars);
    }

    // הגבלת תוצאות
    const limitedResults = results.slice(0, mergedOptions.maxResults || 50);

    // שמירה ב-cache
    if (mergedOptions.enableCache) {
      cacheUtils.setSearchResults(query, results);
    }

    return {
      cars: limitedResults,
      total: results.length,
      query,
      executionTime: Date.now() - startTime,
      fromCache: false
    };
  }

  // חיפוש עם debouncing
  searchWithDebounce(
    query: string,
    cars: Car[],
    callback: (result: SearchResult) => void,
    options: SearchOptimizationOptions = {}
  ): void {
    if (!this.options.enableDebouncing) {
      this.search(query, cars, options).then(callback);
      return;
    }

    // ביטול timer קודם
    const timerKey = `${query}_${JSON.stringify(options)}`;
    const existingTimer = this.debounceTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // יצירת timer חדש
    const newTimer = setTimeout(async () => {
      const result = await this.search(query, cars, options);
      callback(result);
      this.debounceTimers.delete(timerKey);
    }, this.options.debounceDelay || 300);

    this.debounceTimers.set(timerKey, newTimer);
  }

  // חיפוש מתקדם עם פילטרים
  async advancedSearch(
    query: string,
    cars: Car[],
    filters: {
      brand?: string[];
      model?: string[];
      yearMin?: number;
      yearMax?: number;
      priceMin?: number;
      priceMax?: number;
      transmission?: string[];
      fuelType?: string[];
      color?: string[];
    },
    options: SearchOptimizationOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // חיפוש בסיסי
    const searchResult = await this.search(query, cars, options);

    // החלת פילטרים
    let filteredCars = searchResult.cars;

    if (filters.brand && filters.brand.length > 0) {
      filteredCars = filteredCars.filter(car => 
        filters.brand!.includes(car.brand)
      );
    }

    if (filters.model && filters.model.length > 0) {
      filteredCars = filteredCars.filter(car => 
        filters.model!.includes(car.model)
      );
    }

    if (filters.yearMin !== undefined) {
      filteredCars = filteredCars.filter(car => 
        car.year >= filters.yearMin!
      );
    }

    if (filters.yearMax !== undefined) {
      filteredCars = filteredCars.filter(car => 
        car.year <= filters.yearMax!
      );
    }

    if (filters.priceMin !== undefined) {
      filteredCars = filteredCars.filter(car => 
        car.price >= filters.priceMin!
      );
    }

    if (filters.priceMax !== undefined) {
      filteredCars = filteredCars.filter(car => 
        car.price <= filters.priceMax!
      );
    }

    if (filters.transmission && filters.transmission.length > 0) {
      filteredCars = filteredCars.filter(car => 
        filters.transmission!.includes(car.transmission)
      );
    }

    if (filters.fuelType && filters.fuelType.length > 0) {
      filteredCars = filteredCars.filter(car => 
        filters.fuelType!.includes(car.fuelType)
      );
    }

    if (filters.color && filters.color.length > 0) {
      filteredCars = filteredCars.filter(car => 
        filters.color!.includes(car.color)
      );
    }

    return {
      cars: filteredCars,
      total: filteredCars.length,
      query,
      executionTime: Date.now() - startTime,
      fromCache: searchResult.fromCache
    };
  }

  // חיפוש פונטי (עבור עברית)
  private phoneticSearch(query: string, cars: Car[]): Car[] {
    // פונקציה פשוטה לחיפוש פונטי
    // בפועל יש להשתמש בספרייה מתאימה כמו 'hespell' או 'hebcal'
    
    const queryNormalized = this.normalizeHebrew(query);
    
    return cars.filter(car => {
      const carNameNormalized = this.normalizeHebrew(car.name);
      const carBrandNormalized = this.normalizeHebrew(car.brand);
      const carModelNormalized = this.normalizeHebrew(car.model);
      
      return (
        carNameNormalized.includes(queryNormalized) ||
        carBrandNormalized.includes(queryNormalized) ||
        carModelNormalized.includes(queryNormalized)
      );
    });
  }

  // נרמול טקסט עברי
  private normalizeHebrew(text: string): string {
    return text
      .toLowerCase()
      .replace(/[א-ת]/g, (char) => {
        // מיפוי אותיות עבריות לאותיות לטיניות
        const hebrewToLatin: { [key: string]: string } = {
          'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
          'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
          'כ': 'k', 'ל': 'l', 'מ': 'm', 'נ': 'n', 'ס': 's',
          'ע': 'a', 'פ': 'p', 'צ': 'ts', 'ק': 'k', 'ר': 'r',
          'ש': 'sh', 'ת': 't'
        };
        return hebrewToLatin[char] || char;
      });
  }

  // חיפוש עם הצעות
  async searchWithSuggestions(
    query: string,
    cars: Car[],
    options: SearchOptimizationOptions = {}
  ): Promise<{
    results: SearchResult;
    suggestions: string[];
  }> {
    const results = await this.search(query, cars, options);
    
    // יצירת הצעות
    const suggestions = this.generateSuggestions(query, cars);
    
    return {
      results,
      suggestions
    };
  }

  // יצירת הצעות חיפוש
  private generateSuggestions(query: string, cars: Car[]): string[] {
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    cars.forEach(car => {
      // הצעות מברנדים
      if (car.brand.toLowerCase().includes(queryLower)) {
        suggestions.add(car.brand);
      }

      // הצעות ממודלים
      if (car.model.toLowerCase().includes(queryLower)) {
        suggestions.add(car.model);
      }

      // הצעות משנים
      if (car.year.toString().includes(queryLower)) {
        suggestions.add(car.year.toString());
      }

      // הצעות מצבעים
      if (car.color.toLowerCase().includes(queryLower)) {
        suggestions.add(car.color);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  // ניקוי timers
  clearDebounceTimers(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // קבלת סטטיסטיקות
  getStats(): {
    indexSize: number;
    activeTimers: number;
    cacheStats: any;
  } {
    return {
      indexSize: Object.keys(this.searchIndex).length,
      activeTimers: this.debounceTimers.size,
      cacheStats: localCache.getStats()
    };
  }

  // עדכון אינדקס
  updateIndex(cars: Car[]): void {
    this.buildSearchIndex(cars);
  }

  // ניקוי אינדקס
  clearIndex(): void {
    this.searchIndex = {};
  }
}

// יצירת instance גלובלי
export const searchOptimizer = new SearchOptimizer();

// פונקציות עזר
export const searchUtils = {
  // חיפוש מהיר
  quickSearch: (query: string, cars: Car[]) => {
    return searchOptimizer.search(query, cars);
  },

  // חיפוש עם debouncing
  debouncedSearch: (
    query: string,
    cars: Car[],
    callback: (result: SearchResult) => void
  ) => {
    return searchOptimizer.searchWithDebounce(query, cars, callback);
  },

  // חיפוש מתקדם
  advancedSearch: (
    query: string,
    cars: Car[],
    filters: any
  ) => {
    return searchOptimizer.advancedSearch(query, cars, filters);
  },

  // חיפוש עם הצעות
  searchWithSuggestions: (query: string, cars: Car[]) => {
    return searchOptimizer.searchWithSuggestions(query, cars);
  },

  // עדכון אינדקס
  updateSearchIndex: (cars: Car[]) => {
    searchOptimizer.updateIndex(cars);
  },

  // קבלת סטטיסטיקות
  getSearchStats: () => {
    return searchOptimizer.getStats();
  }
};

export default SearchOptimizer;
