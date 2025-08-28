import { supabase } from './supabase';
import { Car } from '../types';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SearchFilters {
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  fuelType?: string;
  transmission?: string;
  condition?: 'new' | 'used';
  color?: string;
  mileageFrom?: number;
  mileageTo?: number;
}

export interface SearchResult {
  cars: Car[];
  total: number;
  hasMore: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'date_added';
  sortOrder?: 'asc' | 'desc';
  random?: boolean;
}

/**
 * חיפוש טקסט חופשי ברכבים
 */
export async function searchCars(options: SearchOptions = {}): Promise<SearchResult> {
  const {
    query = '',
    filters = {},
    page = 1,
    limit = 12,
    sortBy = 'date_added',
    sortOrder = 'desc',
    random = false
  } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.set('q', query.trim());
    }
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    if (limit !== 12) {
      params.set('limit', limit.toString());
    }
    
    if (sortBy !== 'date_added') {
      params.set('sortBy', sortBy);
    }
    
    if (sortOrder !== 'desc') {
      params.set('sortOrder', sortOrder);
    }
    
    if (random) {
      params.set('random', 'true');
    }
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/vehicles?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // The API returns { vehicles: [...], pagination: {...} }
    const vehicles = data.vehicles || [];
    
    // Transform the response to match our expected format
    const cars = vehicles.map((car: any) => ({
      ...car,
      mileage: car.kilometers, // Map kilometers to mileage for compatibility
      images: car.media_files?.map((media: any) => media.file_url) || [],
      createdAt: new Date(car.created_at),
      updatedAt: new Date(car.updated_at)
    }));

    return {
      cars: cars as Car[],
      total: data.pagination?.total || vehicles.length,
      hasMore: data.pagination ? data.pagination.page < data.pagination.pages : vehicles.length === limit
    };

  } catch (error) {
    console.error('Search error:', error);
    // Fallback to Supabase if API fails
    return await searchCarsSupabase(options);
  }
}

/**
 * Fallback search using Supabase directly
 */
async function searchCarsSupabase(options: SearchOptions = {}): Promise<SearchResult> {
  const {
    query = '',
    filters = {},
    page = 1,
    limit = 12,
    sortBy = 'date_added',
    sortOrder = 'desc',
    random = false
  } = options;

  try {
    let queryBuilder = supabase
      .from('cars')
      .select('*, media_files(*)', { count: 'exact' });

    // Full-text search
    if (query.trim()) {
      const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        // Search in multiple fields
        const searchConditions = searchTerms.map(term => 
          `or(brand.ilike.%${term}%,model.ilike.%${term}%,description.ilike.%${term}%,keywords.ilike.%${term}%)`
        ).join(',');
        
        queryBuilder = queryBuilder.or(searchConditions);
      }
    }

    // Apply filters
    if (filters.brand) {
      queryBuilder = queryBuilder.eq('brand', filters.brand);
    }

    if (filters.model) {
      queryBuilder = queryBuilder.eq('model', filters.model);
    }

    if (filters.yearFrom || filters.yearTo) {
      if (filters.yearFrom && filters.yearTo) {
        queryBuilder = queryBuilder.range('year', filters.yearFrom, filters.yearTo);
      } else if (filters.yearFrom) {
        queryBuilder = queryBuilder.gte('year', filters.yearFrom);
      } else if (filters.yearTo) {
        queryBuilder = queryBuilder.lte('year', filters.yearTo);
      }
    }

    if (filters.priceFrom || filters.priceTo) {
      if (filters.priceFrom && filters.priceTo) {
        queryBuilder = queryBuilder.range('price', filters.priceFrom, filters.priceTo);
      } else if (filters.priceFrom) {
        queryBuilder = queryBuilder.gte('price', filters.priceFrom);
      } else if (filters.priceTo) {
        queryBuilder = queryBuilder.lte('price', filters.priceTo);
      }
    }

    if (filters.fuelType) {
      queryBuilder = queryBuilder.eq('fuel_type', filters.fuelType);
    }

    if (filters.transmission) {
      queryBuilder = queryBuilder.eq('transmission', filters.transmission);
    }

    if (filters.condition) {
      queryBuilder = queryBuilder.eq('condition', filters.condition);
    }

    if (filters.color) {
      queryBuilder = queryBuilder.eq('color', filters.color);
    }

    if (filters.mileageFrom || filters.mileageTo) {
      if (filters.mileageFrom && filters.mileageTo) {
        queryBuilder = queryBuilder.range('kilometers', filters.mileageFrom, filters.mileageTo);
      } else if (filters.mileageFrom) {
        queryBuilder = queryBuilder.gte('kilometers', filters.mileageFrom);
      } else if (filters.mileageTo) {
        queryBuilder = queryBuilder.lte('kilometers', filters.mileageTo);
      }
    }

    // Apply sorting
    if (random) {
      // Random sorting using PostgreSQL's random() function
      queryBuilder = queryBuilder.order('id', { ascending: false }); // Fallback for random
         } else {
       // Map sortBy to actual column names
       const columnMap: Record<string, string> = {
         'date_added': 'created_at',
         'price': 'price',
         'year': 'year',
         'mileage': 'kilometers'
       };
       const actualColumn = columnMap[sortBy] || 'created_at';
       queryBuilder = queryBuilder.order(actualColumn, { ascending: sortOrder === 'asc' });
     }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: cars, error, count } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      throw new Error('שגיאה בחיפוש רכבים');
    }

    // If random sorting is requested, shuffle the results
    let shuffledCars = cars || [];
    if (random && shuffledCars.length > 0) {
      shuffledCars = shuffleArray([...shuffledCars]);
    }

    return {
      cars: shuffledCars as Car[],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    };

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('שגיאה בחיפוש רכבים');
  }
}

/**
 * קבלת אפשרויות סינון זמינות
 */
export async function getFilterOptions(): Promise<{
  brands: string[];
  models: string[];
  fuelTypes: string[];
  transmissions: string[];
  colors: string[];
  years: number[];
}> {
  try {
    // Try API first
    const [brandsResponse, modelsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/vehicles/brands`),
      fetch(`${API_BASE_URL}/vehicles/models`)
    ]);

    if (brandsResponse.ok && modelsResponse.ok) {
      const [brands, models] = await Promise.all([
        brandsResponse.json(),
        modelsResponse.json()
      ]);

      return {
        brands: brands || [],
        models: models || [],
        fuelTypes: ['gasoline', 'diesel', 'hybrid', 'electric'], // Static for now
        transmissions: ['manual', 'automatic'], // Static for now
        colors: [], // Will be populated from API later
        years: [] // Will be populated from API later
      };
    }
  } catch (error) {
    console.error('API filter options error:', error);
  }

  // Fallback to Supabase
  try {
    const [
      { data: brands },
      { data: models },
      { data: fuelTypes },
      { data: transmissions },
      { data: colors },
      { data: years }
    ] = await Promise.all([
      supabase.from('cars').select('brand').not('brand', 'is', null),
      supabase.from('cars').select('model').not('model', 'is', null),
      supabase.from('cars').select('fuel_type').not('fuel_type', 'is', null),
      supabase.from('cars').select('transmission').not('transmission', 'is', null),
      supabase.from('cars').select('color').not('color', 'is', null),
      supabase.from('cars').select('year').not('year', 'is', null)
    ]);

    return {
      brands: [...new Set(brands?.map(c => c.brand) || [])].sort(),
      models: [...new Set(models?.map(c => c.model) || [])].sort(),
      fuelTypes: [...new Set(fuelTypes?.map(c => c.fuel_type) || [])].sort(),
      transmissions: [...new Set(transmissions?.map(c => c.transmission) || [])].sort(),
      colors: [...new Set(colors?.map(c => c.color) || [])].sort(),
      years: [...new Set(years?.map(c => c.year) || [])].sort((a, b) => b - a)
    };

  } catch (error) {
    console.error('Filter options error:', error);
    return {
      brands: [],
      models: [],
      fuelTypes: [],
      transmissions: [],
      colors: [],
      years: []
    };
  }
}

/**
 * חיפוש מהיר לפי מילות מפתח
 */
export async function quickSearch(query: string): Promise<Car[]> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*, media_files(*)')
      .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
      .limit(5);

    if (error) {
      console.error('Quick search error:', error);
      return [];
    }

    return data as Car[];

  } catch (error) {
    console.error('Quick search error:', error);
    return [];
  }
}

/**
 * פונקציה לערבוב מערך (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * ניקוי ונרמול טקסט חיפוש
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0590-\u05FF]/g, '') // Remove special chars, keep Hebrew
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * בדיקה אם טקסט מכיל מילות מפתח
 */
export function containsKeywords(text: string, keywords: string[]): boolean {
  const normalizedText = normalizeSearchQuery(text);
  return keywords.some(keyword => 
    normalizedText.includes(normalizeSearchQuery(keyword))
  );
}
