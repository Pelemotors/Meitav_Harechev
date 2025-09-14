import React from 'react';
import { Car, TrendingUp, Users, Eye, MessageSquare } from 'lucide-react';
import { Car as CarType } from '../../types';
import ChatPanel from './ChatPanel';

interface AdminDashboardProps {
  cars: CarType[];
  onAddNewCar?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ cars, onAddNewCar }) => {
  const activeCars = cars.filter(car => car.isActive);
  const totalValue = cars.reduce((sum, car) => sum + car.price, 0);
  const averagePrice = cars.length > 0 ? totalValue / cars.length : 0;
  const recentCars = cars
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'סך הכל רכבים',
      value: cars.length,
      icon: Car,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'רכבים פעילים',
      value: activeCars.length,
      icon: Eye,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'ערך כולל',
      value: `₪${(totalValue / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: 'bg-primary',
      change: '+15%'
    },
    {
      title: 'מחיר ממוצע',
      value: `₪${Math.round(averagePrice / 1000)}K`,
      icon: Users,
      color: 'bg-purple-500',
      change: '+5%'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-darkBlue to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">ברוכים הבאים למערכת הניהול</h1>
        <p className="text-blue-100">סקירה כללית של מלאי הרכבים ופעילות המערכת</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cars */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-darkBlue mb-4">רכבים שנוספו לאחרונה</h2>
          <div className="space-y-4">
            {recentCars.map((car) => (
              <div key={car.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {car.images[0] ? (
                    <img
                      src={car.images[0]}
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Car className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-medium text-gray-900">{car.name}</h3>
                  <p className="text-sm text-gray-500">{formatDate(car.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary">{formatPrice(car.price)}</p>
                  <p className="text-sm text-gray-500">{car.kilometers.toLocaleString()} ק"מ</p>
                </div>
              </div>
            ))}
            {recentCars.length === 0 && (
              <p className="text-gray-500 text-center py-4">אין רכבים להצגה</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-darkBlue mb-4">פעולות מהירות</h2>
          <div className="space-y-3">
            <button 
              onClick={onAddNewCar}
              className="w-full bg-primary text-white p-4 rounded-lg hover:bg-primary/90 transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5" />
                <span className="font-medium">הוסף רכב חדש</span>
              </div>
            </button>
            
            <button 
              onClick={() => alert('דוחות יתווספו בגרסה הבאה')}
              className="w-full bg-gray-100 text-gray-700 p-4 rounded-lg hover:bg-gray-200 transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">צפה בדוחות</span>
              </div>
            </button>
            
            <button 
              onClick={() => window.location.href = '#chat'}
              className="w-full bg-blue-100 text-blue-700 p-4 rounded-lg hover:bg-blue-200 transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">עוזר AI</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-darkBlue mb-4">סטטוס המערכת</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800">שרת פעיל</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800">מסד נתונים מחובר</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800">גיבויים עדכניים</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;