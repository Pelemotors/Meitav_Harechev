import React, { useState, useEffect } from 'react';
import { Gauge, Settings, Calendar, Shuffle, ArrowUpDown, BarChart3, Eye } from 'lucide-react';
import { Car } from '../types';
import { useSearch } from '../hooks/useSearch';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import CarComparison from './CarComparison';
import { Button, Badge } from './ui';
import { useNavigate } from 'react-router-dom';

const useWhatsApp = () => {
  const sendWhatsAppMessage = (carName: string) => {
    const message = `שלום! אני מעוניין בפרטים על הרכב: ${carName}`;
    const whatsappUrl = `https://wa.me/972501234567?text=${encodeURIComponent(message)}`;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(whatsappUrl, '_blank');
    } else {
      // במחשב נפתח את הטופס צור קשר
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return { sendWhatsAppMessage };
};

const CarsSection = () => {
  const { sendWhatsAppMessage } = useWhatsApp();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarsForComparison, setSelectedCarsForComparison] = useState<Car[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  const {
    cars,
    loading,
    error,
    total,
    hasMore,
    query,
    filters,
    sortBy,
    sortOrder,
    random,
    search,
    updateFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    toggleRandom,
    loadMore,
    loadFromURL
  } = useSearch();

  // Load search state from URL on mount
  useEffect(() => {
    loadFromURL();
  }, [loadFromURL]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getTransmissionText = (transmission: string) => {
    return transmission === 'automatic' ? 'אוטומטי' : 'ידני';
  };

  const getSortByText = (sortBy: string) => {
    switch (sortBy) {
      case 'price': return 'מחיר';
      case 'year': return 'שנה';
      case 'mileage': return 'קילומטראז\'';
      case 'date_added': return 'תאריך הוספה';
      default: return 'תאריך הוספה';
    }
  };

  const handleAddToComparison = (car: Car) => {
    if (selectedCarsForComparison.length < 3 && !selectedCarsForComparison.find(c => c.id === car.id)) {
      setSelectedCarsForComparison([...selectedCarsForComparison, car]);
    }
  };

  const handleRemoveFromComparison = (carId: string) => {
    setSelectedCarsForComparison(selectedCarsForComparison.filter(c => c.id !== carId));
  };

  if (loading && cars.length === 0) {
    return (
      <section id="cars" className="section bg-slc-light-gray">
        <div className="container mx-auto px-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-slc-bronze border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slc-gray hebrew">טוען רכבים...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="cars" className="section bg-slc-light-gray">
      <div className="container mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="heading-2 text-slc-dark mb-4">רכבי יוקרה למכירה</h2>
          <p className="body-text text-slc-gray">רכבי יוקרה איכותיים ובדוקים במחירים תחרותיים</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <SearchBar
            onSearch={search}
            onClear={() => search('')}
            placeholder="חיפוש רכבי יוקרה..."
            showFilters={true}
            onToggleFilters={() => setShowFilters(!showFilters)}
            isLoading={loading}
          />

          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />

          {/* Sort and Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slc-gray hebrew">מיון לפי:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field w-auto text-sm"
              >
                <option value="date_added">תאריך הוספה</option>
                <option value="price">מחיר</option>
                <option value="year">שנה</option>
                <option value="mileage">קילומטראז'</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'asc' ? 'עולה' : 'יורד'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={random ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleRandom}
                className="flex items-center gap-1"
              >
                <Shuffle className="w-4 h-4" />
                אקראי
              </Button>
              
              {selectedCarsForComparison.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="w-4 h-4" />
                  השוואה ({selectedCarsForComparison.length})
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slc-gray hebrew">
                נמצאו {total} רכבים
              </p>
              {(query || Object.keys(filters).length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    search('');
                    clearFilters();
                  }}
                  className="text-slc-error hover:text-slc-error"
                >
                  נקה חיפוש
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-slc-error/10 border border-slc-error/20 rounded-lg">
            <p className="text-slc-error text-center hebrew">{error}</p>
          </div>
        )}

        {/* Cars Grid */}
        <div className="grid-3">
          {cars.map((car: Car) => (
            <div key={car.id} className="card hover:shadow-xl transition-all duration-300">
              <div className="mb-4 relative">
                <img 
                  src={car.images?.[0] || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                  alt={car.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {car.isActive && (
                  <Badge variant="success" className="absolute top-2 right-2">
                    זמין
                  </Badge>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-slc-dark mb-2 hebrew">
                {car.name}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="price-text">{formatPrice(car.price)}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slc-gray">
                  <div className="flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    <span>{car.kilometers?.toLocaleString('he-IL') || 0} ק"מ</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    <span>{getTransmissionText(car.transmission || 'automatic')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{car.year}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="primary"
                  className="flex-1"
                  onClick={() => navigate(`/car/${car.id}`)}
                >
                  <Eye className="w-4 h-4 ml-2" />
                  פרטים מלאים
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddToComparison(car)}
                  disabled={selectedCarsForComparison.find(c => c.id === car.id) !== undefined}
                  className="px-3"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* No Results */}
        {!loading && cars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slc-gray hebrew">לא נמצאו רכבים מתאימים</p>
            {(query || Object.keys(filters).length > 0) && (
              <Button
                variant="outline"
                onClick={() => {
                  search('');
                  clearFilters();
                }}
                className="mt-4"
              >
                נקה חיפוש
              </Button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="px-8"
            >
              {loading ? 'טוען...' : 'טען עוד רכבים'}
            </Button>
          </div>
        )}

        {/* Car Comparison Modal */}
        {showComparison && (
          <div className="fixed inset-0 bg-slc-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-slc-white rounded-xl">
              <div className="p-6 border-b border-slc-light-gray">
                <div className="flex items-center justify-between">
                  <h3 className="heading-2 text-slc-dark hebrew">השוואת רכבים</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowComparison(false)}
                  >
                    סגור
                  </Button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <CarComparison
                  selectedCars={selectedCarsForComparison}
                  onRemoveCar={handleRemoveFromComparison}
                  onAddCar={handleAddToComparison}
                  maxCars={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CarsSection;