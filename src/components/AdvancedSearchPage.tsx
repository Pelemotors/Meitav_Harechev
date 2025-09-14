import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdvancedCarSearch from './AdvancedCarSearch';
import Button from './ui/Button';

interface SearchFilters {
  manufacturer: string;
  model: string;
  minPrice: number;
  maxPrice: number;
  minMonthlyPayment: number;
  maxMonthlyPayment: number;
}

const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (filters: SearchFilters) => {
    setIsSearching(true);
    
    // כאן תריץ את החיפוש האמיתי במסד הנתונים
    // כרגע זה רק דוגמה
    setTimeout(() => {
      console.log('חיפוש מתקדם:', filters);
      setIsSearching(false);
      
      // מעבר לדף התוצאות עם הפילטרים
      const searchParams = new URLSearchParams();
      if (filters.manufacturer) searchParams.set('manufacturer', filters.manufacturer);
      if (filters.model) searchParams.set('model', filters.model);
      if (filters.minPrice) searchParams.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) searchParams.set('maxPrice', filters.maxPrice.toString());
      if (filters.minMonthlyPayment) searchParams.set('minMonthlyPayment', filters.minMonthlyPayment.toString());
      if (filters.maxMonthlyPayment) searchParams.set('maxMonthlyPayment', filters.maxMonthlyPayment.toString());
      
      navigate(`/?${searchParams.toString()}`);
    }, 1500);
  };

  const handleClearSearch = () => {
    // מעבר לדף הבית
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900">
              חיפוש רכבים מתקדם
            </h1>
            
            <div></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            מצא את הרכב המושלם עבורך
          </h2>
          <p className="text-lg text-gray-600">
            השתמש בפילטרים המתקדמים כדי למצוא בדיוק את מה שאתה מחפש
          </p>
        </div>

        <AdvancedCarSearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
          loading={isSearching}
        />

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            מידע על החיפוש המתקדם
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>חיפוש לפי יצרן ודגם:</strong> בחר מתוך רשימה של 1,244 יצרנים ודגמים</p>
            <p>• <strong>טווח מחירים:</strong> הגדר את התקציב שלך מ-5,000 ₪ עד 400,000 ₪</p>
            <p>• <strong>החזר חודשי משוער:</strong> קבל הערכה של ההחזר החודשי הצפוי</p>
            <p>• <strong>חישוב מימון:</strong> מחשבון מימון מתקדם עם אפשרויות התאמה</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;
