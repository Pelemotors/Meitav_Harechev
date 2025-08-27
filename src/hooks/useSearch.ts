import { useState, useEffect, useCallback } from 'react';
import { searchCars, SearchFilters, SearchResult, SearchOptions } from '../utils/search';
import { Car } from '../types';

interface UseSearchReturn {
  // State
  cars: Car[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  currentPage: number;
  
  // Search state
  query: string;
  filters: SearchFilters;
  sortBy: 'price' | 'year' | 'mileage' | 'date_added';
  sortOrder: 'asc' | 'desc';
  random: boolean;
  
  // Actions
  search: (query: string) => void;
  updateFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: 'price' | 'year' | 'mileage' | 'date_added') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleRandom: () => void;
  loadMore: () => void;
  reset: () => void;
  
  // URL state management
  updateURL: () => void;
  loadFromURL: () => void;
}

export function useSearch(): UseSearchReturn {
  // Search state
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortByState] = useState<'price' | 'year' | 'mileage' | 'date_added'>('date_added');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');
  const [random, setRandom] = useState(false);
  
  // Results state
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  // Perform search
  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters,
    page: number = 1,
    append: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const options: SearchOptions = {
        query: searchQuery,
        filters: searchFilters,
        page,
        limit: 12,
        sortBy,
        sortOrder,
        random
      };
      
      const result: SearchResult = await searchCars(options);
      
      if (append) {
        setCars(prev => [...prev, ...result.cars]);
      } else {
        setCars(result.cars);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(page);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בחיפוש רכבים');
      if (!append) {
        setCars([]);
        setTotal(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, random]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      performSearch(query, filters, 1, false);
    }, 300);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [query, filters, sortBy, sortOrder, random, performSearch]);

  // Search actions
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setCurrentPage(1);
  }, []);

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setSortBy = useCallback((newSortBy: 'price' | 'year' | 'mileage' | 'date_added') => {
    setSortByState(newSortBy);
    setCurrentPage(1);
  }, []);

  const setSortOrder = useCallback((newOrder: 'asc' | 'desc') => {
    setSortOrderState(newOrder);
    setCurrentPage(1);
  }, []);

  const toggleRandom = useCallback(() => {
    setRandom(prev => !prev);
    setCurrentPage(1);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      performSearch(query, filters, currentPage + 1, true);
    }
  }, [loading, hasMore, query, filters, currentPage, performSearch]);

  const reset = useCallback(() => {
    setQuery('');
    setFilters({});
    setSortByState('date_added');
    setSortOrderState('desc');
    setRandom(false);
    setCars([]);
    setLoading(false);
    setError(null);
    setTotal(0);
    setHasMore(false);
    setCurrentPage(1);
  }, []);

  // URL state management
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (sortBy !== 'date_added') params.set('sort', sortBy);
    if (sortOrder !== 'desc') params.set('order', sortOrder);
    if (random) params.set('random', 'true');
    
    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
  }, [query, filters, sortBy, sortOrder, random]);

  const loadFromURL = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    
    const urlQuery = params.get('q') || '';
    const urlSortBy = params.get('sort') as 'price' | 'year' | 'mileage' | 'date_added' || 'date_added';
    const urlSortOrder = params.get('order') as 'asc' | 'desc' || 'desc';
    const urlRandom = params.get('random') === 'true';
    
    // Load filters from URL
    const urlFilters: SearchFilters = {};
    const filterKeys: (keyof SearchFilters)[] = [
      'brand', 'model', 'yearFrom', 'yearTo', 'priceFrom', 'priceTo',
      'fuelType', 'transmission', 'condition', 'color', 'mileageFrom', 'mileageTo'
    ];
    
    filterKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        if (['yearFrom', 'yearTo', 'priceFrom', 'priceTo', 'mileageFrom', 'mileageTo'].includes(key)) {
          urlFilters[key] = parseInt(value);
        } else {
          urlFilters[key] = value;
        }
      }
    });
    
    // Update state
    setQuery(urlQuery);
    setFilters(urlFilters);
    setSortByState(urlSortBy);
    setSortOrderState(urlSortOrder);
    setRandom(urlRandom);
  }, []);

  // Update URL when search state changes
  useEffect(() => {
    updateURL();
  }, [query, filters, sortBy, sortOrder, random, updateURL]);

  return {
    // State
    cars,
    loading,
    error,
    total,
    hasMore,
    currentPage,
    
    // Search state
    query,
    filters,
    sortBy,
    sortOrder,
    random,
    
    // Actions
    search,
    updateFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    toggleRandom,
    loadMore,
    reset,
    
    // URL state management
    updateURL,
    loadFromURL
  };
}
