import React from 'react';
import { Car } from '../types';
import { Card, Badge } from './ui';
import { 
  Gauge, 
  Settings, 
  Calendar, 
  Fuel, 
  Car as CarIcon, 
  Palette,
  MapPin,
  Shield,
  Zap,
  Users
} from 'lucide-react';

interface CarSpecsProps {
  car: Car;
}

const CarSpecs: React.FC<CarSpecsProps> = ({ car }) => {
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

  const specs = [
    {
      category: 'מידע כללי',
      items: [
        { label: 'מותג', value: car.brand || 'לא צוין', icon: CarIcon },
        { label: 'דגם', value: car.model || 'לא צוין', icon: CarIcon },
        { label: 'שנת ייצור', value: car.year?.toString() || 'לא צוין', icon: Calendar },
        { label: 'מצב', value: car.isActive ? 'זמין' : 'לא זמין', icon: Shield, badge: car.isActive ? 'success' : 'error' }
      ]
    },
    {
      category: 'ביצועים',
      items: [
        { label: 'קילומטראז\'', value: `${car.kilometers?.toLocaleString('he-IL') || 0} ק"מ`, icon: Gauge },
        { label: 'תיבת הילוכים', value: getTransmissionText(car.transmission || 'automatic'), icon: Settings },
        { label: 'סוג דלק', value: getFuelTypeText(car.fuelType || 'gasoline'), icon: Fuel },
        { label: 'צבע', value: car.color || 'לא צוין', icon: Palette }
      ]
    },
    {
      category: 'מידע נוסף',
      items: [
        { label: 'מחיר', value: formatPrice(car.price), icon: Zap, highlight: true },
        { label: 'מיקום', value: car.location || 'נתניה', icon: MapPin },
        { label: 'מספר מושבים', value: car.seats?.toString() || '5', icon: Users },
        { label: 'תיאור', value: car.description ? 'קיים' : 'אין', icon: Shield }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Car Overview */}
      <div className="bg-gradient-to-r from-slc-bronze/10 to-slc-bronze/5 rounded-xl p-6">
        <h3 className="heading-3 text-slc-dark mb-4 hebrew">מפרט טכני - {car.name}</h3>
        <p className="text-slc-gray hebrew">
          מפרט מלא של הרכב כולל כל הפרטים הטכניים והמידע הרלוונטי
        </p>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specs.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="p-6">
            <h4 className="heading-3 text-slc-dark mb-4 hebrew border-b border-slc-light-gray pb-2">
              {category.category}
            </h4>
            
            <div className="space-y-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slc-bronze/10 rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-slc-bronze" />
                    </div>
                    <span className="text-slc-gray hebrew text-sm">{item.label}:</span>
                  </div>
                  
                  <div className="text-left">
                    {item.badge ? (
                      <Badge variant={item.badge as any} size="sm">
                        {item.value}
                      </Badge>
                    ) : (
                      <span className={`hebrew text-sm ${item.highlight ? 'price-text font-bold' : 'text-slc-dark'}`}>
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Features */}
      {car.features && car.features.length > 0 && (
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">תכונות נוספות</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {car.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slc-bronze rounded-full" />
                <span className="text-slc-dark hebrew text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Description */}
      {car.description && (
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">תיאור מפורט</h4>
          <div className="prose prose-sm max-w-none hebrew">
            <p className="text-slc-dark leading-relaxed">{car.description}</p>
          </div>
        </Card>
      )}

      {/* Technical Details */}
      <Card className="p-6">
        <h4 className="heading-3 text-slc-dark mb-4 hebrew">פרטים טכניים נוספים</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">מנוע:</span>
              <span className="text-slc-dark hebrew">{car.engine || 'לא צוין'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">הספק:</span>
              <span className="text-slc-dark hebrew">{car.power || 'לא צוין'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">נפח מנוע:</span>
              <span className="text-slc-dark hebrew">{car.engineSize || 'לא צוין'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">צריכת דלק:</span>
              <span className="text-slc-dark hebrew">{car.fuelConsumption || 'לא צוין'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">מהירות מקסימלית:</span>
              <span className="text-slc-dark hebrew">{car.maxSpeed || 'לא צוין'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slc-light-gray">
              <span className="text-slc-gray hebrew">תאוצה 0-100:</span>
              <span className="text-slc-dark hebrew">{car.acceleration || 'לא צוין'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Safety & Comfort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">בטיחות</h4>
          <div className="space-y-2">
            {['כריות אוויר', 'מערכת בלימה מתקדמת', 'מצלמות ראייה אחורית', 'חיישני חניה'].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slc-success rounded-full" />
                <span className="text-slc-dark hebrew text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <h4 className="heading-3 text-slc-dark mb-4 hebrew">נוחות</h4>
          <div className="space-y-2">
            {['מיזוג אוויר', 'מערכת שמע מתקדמת', 'מושבים חשמליים', 'חלונות חשמליים'].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slc-bronze rounded-full" />
                <span className="text-slc-dark hebrew text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="p-6 bg-gradient-to-r from-slc-bronze/5 to-slc-bronze/10">
        <h4 className="heading-3 text-slc-dark mb-4 hebrew">מידע ליצירת קשר</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-slc-bronze/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="w-6 h-6 text-slc-bronze" />
            </div>
            <p className="text-slc-dark hebrew font-medium">נתניה</p>
            <p className="text-slc-gray hebrew text-sm">מרכז רכבי יוקרה</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-slc-bronze/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-slc-bronze" />
            </div>
            <p className="text-slc-dark hebrew font-medium">בדיקה מלאה</p>
            <p className="text-slc-gray hebrew text-sm">רכב בדוק ומאושר</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-slc-bronze/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-slc-bronze" />
            </div>
            <p className="text-slc-dark hebrew font-medium">מימון זמין</p>
            <p className="text-slc-gray hebrew text-sm">תנאים מיוחדים</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CarSpecs;
