import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from './ui';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = 'חיפוש רכבים...',
  className = '',
  showFilters = true,
  onToggleFilters,
  isLoading = false
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(query.trim());
      }, 300);
    } else {
      onClear();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch, onClear]);

  const handleClear = () => {
    setQuery('');
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        relative flex items-center bg-slc-white border-2 rounded-xl transition-all duration-300
        ${isFocused ? 'border-slc-bronze shadow-lg' : 'border-slc-light-gray'}
        ${isLoading ? 'opacity-75' : ''}
      `}>
        {/* Search Icon */}
        <div className="absolute right-4 text-slc-gray">
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-slc-bronze border-t-transparent rounded-full" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full px-12 py-4 text-right hebrew
            bg-transparent border-none outline-none
            placeholder:text-slc-gray placeholder:text-sm
            text-slc-dark text-base
            focus:ring-0 focus:outline-none
          "
          disabled={isLoading}
        />

        {/* Clear Button */}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="
              absolute left-4 p-1 text-slc-gray hover:text-slc-dark
              transition-colors duration-200
            "
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Filters Toggle */}
        {showFilters && onToggleFilters && (
          <div className="absolute left-12 border-l border-slc-light-gray">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFilters}
              className="
                h-full px-3 text-slc-gray hover:text-slc-bronze
                hover:bg-slc-bronze/5 rounded-none
              "
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Search Suggestions (Future Enhancement) */}
      {isFocused && query && (
        <div className="
          absolute top-full left-0 right-0 mt-2 bg-slc-white border border-slc-light-gray
          rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto
        ">
          <div className="p-4 text-center text-slc-gray text-sm hebrew">
            חיפוש מתקדם יוצג כאן...
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
