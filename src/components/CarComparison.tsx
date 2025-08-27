import React, { useState, useEffect } from 'react';
import { X, Plus, BarChart3, Car, Gauge, Settings, Calendar, Fuel } from 'lucide-react';
import { Car as CarType } from '../types';
import { Button, Badge, Card } from './ui';
import { supabase } from '../utils/supabase';

interface CarComparisonProps {
  selectedCars: CarType[];
  onRemoveCar: (carId: string) => void;
  onAddCar: (car: CarType) => void;
  maxCars?: number;
}

const CarComparison: React.FC<CarComparisonProps> = ({
  selectedCars,
  onRemoveCar,
  onAddCar,
  maxCars = 3
}) => {
  const [availableCars, setAvailableCars] = useState<CarType[]>([]);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableCars = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*, media_files(*)')
          .eq('isActive', true)
          .order('price', { ascending: false });

        if (error) throw error;
        setAvailableCars(data as CarType[]);
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCars();
  }, []);

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

  const getFuelTypeText = (fuelType: string) => {
    const fuelTypes: { [key: string]: string } = {
      'gasoline': 'בנזין',
      'diesel': 'דיזל',
      'hybrid': 'היברידי',
      'electric': 'חשמלי',
      'lpg': 'גז',
      'petrol': 'בנזין'
    };
    return fuelTypes[fuelType] || fuelType;
  };

  const comparisonSpecs = [
    { key: 'price', label: 'מחיר', icon: Car, format: formatPrice },
    { key: 'year', label: 'שנה', icon: Calendar, format: (value: number) => value?.toString() },
    { key: 'kilometers', label: 'קילומטראז\'', icon: Gauge, format: (value: number) => `${value?.toLocaleString('he-IL') || 0} ק"מ` },
    { key: 'transmission', label: 'תיבת הילוכים', icon: Settings, format: getTransmissionText },
    { key: 'fuelType', label: 'סוג דלק', icon: Fuel, format: getFuelTypeText },
    { key: 'color', label: 'צבע', icon: Car, format: (value: string) => value || 'לא צוין' }
  ];

  const getBestValue = (specKey: string, cars: CarType[]) => {
    if (cars.length === 0) return null;
    
    const values = cars.map(car => car[specKey as keyof CarType]).filter(v => v !== undefined);
    if (values.length === 0) return null;

    if (specKey === 'price') {
      return Math.min(...values as number[]);
    } else if (specKey === 'year') {
      return Math.max(...values as number[]);
    } else if (specKey === 'kilometers') {
      return Math.min(...values as number[]);
    }
    
    return null;
  };

  const getWorstValue = (specKey: string, cars: CarType[]) => {
    if (cars.length === 0) return null;
    
    const values = cars.map(car => car[specKey as keyof CarType]).filter(v => v !== undefined);
    if (values.length === 0) return null;

    if (specKey === 'price') {
      return Math.max(...values as number[]);
    } else if (specKey === 'year') {
      return Math.min(...values as number[]);
    } else if (specKey === 'kilometers') {
      return Math.max(...values as number[]);
    }
    
    return null;
  };

  const handleAddCar = (car: CarType) => {
    if (selectedCars.length < maxCars) {
      onAddCar(car);
      setShowCarSelector(false);
    }
  };

  if (selectedCars.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-16 h-16 text-slc-gray mx-auto mb-4" />
        <h3 className="heading-3 text-slc-dark mb-2 hebrew">השוואת רכבים</h3>
        <p className="text-slc-gray hebrew mb-6">
          בחר עד {maxCars} רכבים להשוואה מפורטת
        </p>
        <Button
          variant="primary"
          onClick={() => setShowCarSelector(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף רכב להשוואה
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="heading-2 text-slc-dark hebrew">השוואת רכבים</h3>
          <p className="text-slc-gray hebrew">
            {selectedCars.length} מתוך {maxCars} רכבים נבחרו
          </p>
        </div>
        
        {selectedCars.length < maxCars && (
          <Button
            variant="outline"
            onClick={() => setShowCarSelector(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            הוסף רכב
          </Button>
        )}
      </div>

      {/* Car Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedCars.map((car) => (
          <Card key={car.id} className="p-4 relative">
            <button
              onClick={() => onRemoveCar(car.id)}
              className="absolute top-2 right-2 text-slc-gray hover:text-slc-error transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-4">
              <img
                src={car.images?.[0] || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={car.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h4 className="heading-3 text-slc-dark hebrew">{car.name}</h4>
              <p className="text-slc-gray hebrew text-sm">{car.brand} {car.model}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slc-light-gray">
              <tr>
                <th className="text-right p-4 hebrew">מפרט</th>
                {selectedCars.map((car) => (
                  <th key={car.id} className="text-center p-4 hebrew min-w-[200px]">
                    {car.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonSpecs.map((spec) => {
                const bestValue = getBestValue(spec.key, selectedCars);
                const worstValue = getWorstValue(spec.key, selectedCars);
                
                return (
                  <tr key={spec.key} className="border-b border-slc-light-gray">
                    <td className="p-4 text-slc-gray hebrew">
                      <div className="flex items-center gap-2">
                        <spec.icon className="w-4 h-4" />
                        {spec.label}
                      </div>
                    </td>
                    {selectedCars.map((car) => {
                      const value = car[spec.key as keyof CarType];
                      const formattedValue = spec.format(value as any);
                      const isBest = value === bestValue;
                      const isWorst = value === worstValue;
                      
                      return (
                        <td key={car.id} className="p-4 text-center">
                          <div className={`hebrew ${isBest ? 'text-slc-success font-bold' : isWorst ? 'text-slc-error' : 'text-slc-dark'}`}>
                            {formattedValue}
                          </div>
                          {isBest && (
                            <Badge variant="success" size="sm" className="mt-1">
                              הטוב ביותר
                            </Badge>
                          )}
                          {isWorst && isBest !== isWorst && (
                            <Badge variant="error" size="sm" className="mt-1">
                              הגבוה ביותר
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <h4 className="heading-3 text-slc-dark mb-2 hebrew">מחיר נמוך ביותר</h4>
          <p className="price-text">
            {selectedCars.length > 0 ? formatPrice(Math.min(...selectedCars.map(c => c.price))) : 'N/A'}
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <h4 className="heading-3 text-slc-dark mb-2 hebrew">שנה חדשה ביותר</h4>
          <p className="text-slc-dark hebrew text-lg">
            {selectedCars.length > 0 ? Math.max(...selectedCars.map(c => c.year || 0)) : 'N/A'}
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <h4 className="heading-3 text-slc-dark mb-2 hebrew">קילומטראז' נמוך ביותר</h4>
          <p className="text-slc-dark hebrew text-lg">
            {selectedCars.length > 0 ? `${Math.min(...selectedCars.map(c => c.kilometers || 0)).toLocaleString('he-IL')} ק"מ` : 'N/A'}
          </p>
        </Card>
      </div>

      {/* Car Selector Modal */}
      {showCarSelector && (
        <div className="fixed inset-0 bg-slc-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slc-light-gray">
              <div className="flex items-center justify-between">
                <h3 className="heading-2 text-slc-dark hebrew">בחר רכב להשוואה</h3>
                <button
                  onClick={() => setShowCarSelector(false)}
                  className="text-slc-gray hover:text-slc-dark"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-slc-bronze border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slc-gray hebrew">טוען רכבים...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCars
                    .filter(car => !selectedCars.find(selected => selected.id === car.id))
                    .map((car) => (
                      <div
                        key={car.id}
                        className="border border-slc-light-gray rounded-lg p-4 cursor-pointer hover:border-slc-bronze transition-colors"
                        onClick={() => handleAddCar(car)}
                      >
                        <img
                          src={car.images?.[0] || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={car.name}
                          className="w-full h-24 object-cover rounded mb-3"
                        />
                        <h4 className="font-bold text-slc-dark hebrew text-sm mb-1">{car.name}</h4>
                        <p className="text-slc-gray hebrew text-xs mb-2">{car.brand} {car.model}</p>
                        <p className="price-text text-sm">{formatPrice(car.price)}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CarComparison;
