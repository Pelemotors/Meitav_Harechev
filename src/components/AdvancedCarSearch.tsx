import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

interface Manufacturer {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
}

interface ManufacturersData {
  manufacturers: Manufacturer[];
  models: { [manufacturerName: string]: Model[] };
}

interface SearchFilters {
  manufacturer: string;
  model: string;
  minPrice: number;
  maxPrice: number;
  minMonthlyPayment: number;
  maxMonthlyPayment: number;
}

interface AdvancedCarSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
  loading?: boolean;
}

export const AdvancedCarSearch: React.FC<AdvancedCarSearchProps> = ({
  onSearch,
  onClear,
  loading = false
}) => {
  const [data, setData] = useState<ManufacturersData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    manufacturer: '',
    model: '',
    minPrice: 5000,
    maxPrice: 400000,
    minMonthlyPayment: 500,
    maxMonthlyPayment: 10000
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./data/manufacturers_models.json');
        if (!response.ok) {
          throw new Error('שגיאה בטעינת נתוני היצרנים והדגמים');
        }
        const manufacturersData = await response.json();
        setData(manufacturersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const handleManufacturerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturer = event.target.value;
    setFilters(prev => ({
      ...prev,
      manufacturer,
      model: '' // איפוס הדגם כשמשנים יצרן
    }));
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      model: event.target.value
    }));
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMonthlyPaymentChange = (field: 'minMonthlyPayment' | 'maxMonthlyPayment', value: number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const defaultFilters: SearchFilters = {
      manufacturer: '',
      model: '',
      minPrice: 5000,
      maxPrice: 400000,
      minMonthlyPayment: 500,
      maxMonthlyPayment: 10000
    };
    setFilters(defaultFilters);
    if (onClear) {
      onClear();
    }
  };

  const availableModels = filters.manufacturer && data 
    ? data.models[filters.manufacturer] || []
    : [];

  // חישוב החזר חודשי משוער (דוגמה - ניתן להתאים)
  const calculateEstimatedMonthlyPayment = (price: number): number => {
    // הנחה: הלוואה ל-5 שנים בריבית 8%
    const annualRate = 0.08;
    const monthlyRate = annualRate / 12;
    const numberOfPayments = 60; // 5 שנים
    
    if (monthlyRate === 0) return price / numberOfPayments;
    
    return price * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  if (dataLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-2">טוען נתונים...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">לא נמצאו נתונים</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">חיפוש רכב מתקדם</h2>
          <p className="text-gray-600">מצא את הרכב המושלם עבורך</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* בחירת יצרן */}
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
              יצרן
            </label>
            <select
              id="manufacturer"
              value={filters.manufacturer}
              onChange={handleManufacturerChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל היצרנים</option>
              {data.manufacturers
                .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                .map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.name}>
                    {manufacturer.name}
                  </option>
                ))}
            </select>
          </div>

          {/* בחירת דגם */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              דגם
            </label>
            <select
              id="model"
              value={filters.model}
              onChange={handleModelChange}
              disabled={!filters.manufacturer}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">כל הדגמים</option>
              {availableModels
                .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                .map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* טווח מחירים */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">טווח מחירים (₪)</h3>
          <div className="px-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">מחיר מינימלי</label>
              <input
                type="range"
                min="5000"
                max="400000"
                step="5000"
                value={filters.minPrice}
                onChange={(e) => handlePriceChange('minPrice', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((filters.minPrice - 5000) / (400000 - 5000)) * 100}%, #e5e7eb ${((filters.minPrice - 5000) / (400000 - 5000)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₪5,000</span>
                <span className="font-bold">₪{filters.minPrice.toLocaleString()}</span>
                <span>₪400,000</span>
              </div>
            </div>
            <div className="relative mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">מחיר מקסימלי</label>
              <input
                type="range"
                min="5000"
                max="400000"
                step="5000"
                value={filters.maxPrice}
                onChange={(e) => handlePriceChange('maxPrice', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((filters.maxPrice - 5000) / (400000 - 5000)) * 100}%, #ef4444 ${((filters.maxPrice - 5000) / (400000 - 5000)) * 100}%, #ef4444 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₪5,000</span>
                <span className="font-bold">₪{filters.maxPrice.toLocaleString()}</span>
                <span>₪400,000</span>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            טווח מחירים: ₪{filters.minPrice.toLocaleString()} - ₪{filters.maxPrice.toLocaleString()}
          </div>
        </div>

        {/* טווח החזר חודשי */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">החזר חודשי משוער (₪)</h3>
          <div className="px-4">
            <div className="relative">
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={filters.minMonthlyPayment}
                onChange={(e) => handleMonthlyPaymentChange('minMonthlyPayment', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((filters.minMonthlyPayment - 500) / (10000 - 500)) * 100}%, #e5e7eb ${((filters.minMonthlyPayment - 500) / (10000 - 500)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₪500</span>
                <span>₪{filters.minMonthlyPayment.toLocaleString()}</span>
                <span>₪10,000</span>
              </div>
            </div>
            <div className="relative mt-4">
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={filters.maxMonthlyPayment}
                onChange={(e) => handleMonthlyPaymentChange('maxMonthlyPayment', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((filters.maxMonthlyPayment - 500) / (10000 - 500)) * 100}%, #f59e0b ${((filters.maxMonthlyPayment - 500) / (10000 - 500)) * 100}%, #f59e0b 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₪500</span>
                <span>₪{filters.maxMonthlyPayment.toLocaleString()}</span>
                <span>₪10,000</span>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
            טווח החזר חודשי: ₪{filters.minMonthlyPayment.toLocaleString()} - ₪{filters.maxMonthlyPayment.toLocaleString()}
          </div>
          
          {/* חישוב משוער */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">חישוב משוער:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>רכב ב-₪{filters.minPrice.toLocaleString()} ≈ ₪{Math.round(calculateEstimatedMonthlyPayment(filters.minPrice)).toLocaleString()} לחודש</p>
              <p>רכב ב-₪{filters.maxPrice.toLocaleString()} ≈ ₪{Math.round(calculateEstimatedMonthlyPayment(filters.maxPrice)).toLocaleString()} לחודש</p>
              <p className="text-xs text-blue-600 mt-2">
                * החישוב מבוסס על הלוואה ל-5 שנים בריבית 8% (הערכה בלבד)
              </p>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'מחפש...' : 'חפש רכבים'}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            נקה חיפוש
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AdvancedCarSearch;
