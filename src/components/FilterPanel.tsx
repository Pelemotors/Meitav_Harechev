import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button, Badge } from './ui';
import { SearchFilters, getFilterOptions } from '../utils/search';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onToggle,
  className = ''
}) => {
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    models: [],
    fuelTypes: [],
    transmissions: [],
    colors: [],
    years: []
  });
  const [manufacturersData, setManufacturersData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        // Try to load from our JSON file first
        const response = await fetch('./data/manufacturers_models.json');
        if (response.ok) {
          const data = await response.json();
          setManufacturersData(data);
          
          const brands = data.manufacturers.map((m: any) => m.name);
          const allModels = Object.values(data.models).flat().map((m: any) => m.name);
          
          setFilterOptions({
            brands,
            models: allModels,
            fuelTypes: ['בנזין', 'דיזל', 'היברידי', 'חשמלי'],
            transmissions: ['אוטומטי', 'ידני'],
            colors: ['לבן', 'שחור', 'כסף', 'אפור', 'כחול', 'אדום', 'ירוק'],
            years: Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i)
          });
        } else {
          // Fallback to old method
          const options = await getFilterOptions();
          setFilterOptions(options);
        }
      } catch (error) {
        console.error('Failed to load filter options:', error);
        // Fallback to old method
        try {
          const options = await getFilterOptions();
          setFilterOptions(options);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    
    // אם משנים יצרן, מאפסים את הדגם
    if (key === 'brand') {
      newFilters.model = undefined;
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => filters[key as keyof SearchFilters] !== undefined).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`${className}`}>
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          סינון מתקדם
          {activeFiltersCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFiltersCount}
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-slc-error hover:text-slc-error"
          >
            נקה הכל
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-slc-white border border-slc-light-gray rounded-xl p-6 shadow-lg animate-fade-in">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-slc-bronze border-t-transparent rounded-full" />
              <span className="mr-3 text-slc-gray hebrew">טוען אפשרויות...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Brand & Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    מותג
                  </label>
                  <select
                    value={filters.brand || ''}
                    onChange={(e) => updateFilter('brand', e.target.value || undefined)}
                    className="input-field"
                  >
                    <option value="">כל המותגים</option>
                    {filterOptions.brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    דגם
                  </label>
                  <select
                    value={filters.model || ''}
                    onChange={(e) => updateFilter('model', e.target.value || undefined)}
                    className="input-field"
                    disabled={!filters.brand}
                  >
                    <option value="">כל הדגמים</option>
                    {(() => {
                      if (!manufacturersData || !filters.brand) {
                        return filterOptions.models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ));
                      }
                      
                      const manufacturerModels = manufacturersData.models[filters.brand] || [];
                      return manufacturerModels.map((model: any) => (
                        <option key={model.id} value={model.name}>{model.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Year Range */}
              <div>
                <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                  שנת ייצור
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={filters.yearFrom || ''}
                    onChange={(e) => updateFilter('yearFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  >
                    <option value="">משנת</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <select
                    value={filters.yearTo || ''}
                    onChange={(e) => updateFilter('yearTo', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  >
                    <option value="">עד שנת</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                  טווח מחירים (₪)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="מ-"
                    value={filters.priceFrom || ''}
                    onChange={(e) => updateFilter('priceFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder="עד"
                    value={filters.priceTo || ''}
                    onChange={(e) => updateFilter('priceTo', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Fuel Type & Transmission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    סוג דלק
                  </label>
                  <select
                    value={filters.fuelType || ''}
                    onChange={(e) => updateFilter('fuelType', e.target.value || undefined)}
                    className="input-field"
                  >
                    <option value="">כל סוגי הדלק</option>
                    {filterOptions.fuelTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    תיבת הילוכים
                  </label>
                  <select
                    value={filters.transmission || ''}
                    onChange={(e) => updateFilter('transmission', e.target.value || undefined)}
                    className="input-field"
                  >
                    <option value="">כל התיבות</option>
                    {filterOptions.transmissions.map(trans => (
                      <option key={trans} value={trans}>{trans}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Condition & Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    מצב הרכב
                  </label>
                  <select
                    value={filters.condition || ''}
                    onChange={(e) => updateFilter('condition', e.target.value as 'new' | 'used' | undefined)}
                    className="input-field"
                  >
                    <option value="">כל המצבים</option>
                    <option value="new">חדש</option>
                    <option value="used">משומש</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                    צבע
                  </label>
                  <select
                    value={filters.color || ''}
                    onChange={(e) => updateFilter('color', e.target.value || undefined)}
                    className="input-field"
                  >
                    <option value="">כל הצבעים</option>
                    {filterOptions.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mileage Range */}
              <div>
                <label className="block text-sm font-medium text-slc-dark mb-2 hebrew">
                  קילומטראז' (ק"מ)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="מ-"
                    value={filters.mileageFrom || ''}
                    onChange={(e) => updateFilter('mileageFrom', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  />
                  <input
                    type="number"
                    placeholder="עד"
                    value={filters.mileageTo || ''}
                    onChange={(e) => updateFilter('mileageTo', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 pt-6 border-t border-slc-light-gray">
              <h4 className="text-sm font-medium text-slc-dark mb-3 hebrew">
                סינונים פעילים:
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value === undefined) return null;
                  
                  let displayValue = value;
                  if (key === 'condition') {
                    displayValue = value === 'new' ? 'חדש' : 'משומש';
                  }
                  
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <span className="hebrew">{displayValue}</span>
                      <button
                        onClick={() => clearFilter(key as keyof SearchFilters)}
                        className="text-slc-gray hover:text-slc-error transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
