import React, { useState, useEffect } from 'react';
import { getCarsWithMedia, saveCar, updateCar, deleteCar, uploadMediaFile } from '../../utils/storage';
import { Car } from '../../types';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import CarsTable from './CarsTable';
import CarForm from './CarForm';
import LeadsManager from './LeadsManager';
import WhatsAppIntegration from './WhatsAppIntegration';
import WhatsAppTemplates from './WhatsAppTemplates';
import SitemapManager from './SitemapManager';
import SettingsManager from './SettingsManager';
import { Plus } from 'lucide-react';

const AdminAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    const initializeApp = async () => {
      if (isAuthenticated) {
        try {
          const carsData = await getCarsWithMedia();
          setCars(carsData);
        } catch (error) {
          console.error('Error loading cars:', error);
          setCars([]);
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, [isAuthenticated]);

  const handleLogout = () => {
    setCurrentPage('dashboard');
    setCars([]);
  };

  const handleSaveCar = async (carData: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let savedCar: Car;
      
      if (editingCar) {
        const updatedCar = await updateCar(editingCar.id, carData);
        if (updatedCar) {
          setCars(prev => prev.map(car => car.id === editingCar.id ? updatedCar : car));
          savedCar = updatedCar;
        } else {
          throw new Error('Failed to update car');
        }
      } else {
        const newCar = await saveCar(carData);
        setCars(prev => [...prev, newCar]);
        savedCar = newCar;
      }
      
      // Upload any pending media files
      if (pendingMediaFiles.length > 0) {
        try {
          for (const file of pendingMediaFiles) {
            await uploadMediaFile(file, savedCar.id);
          }
          setPendingMediaFiles([]);
          
          // Refresh cars to get updated media
          const updatedCars = await getCarsWithMedia();
          setCars(updatedCars);
        } catch (error) {
          console.error('Error uploading media files:', error);
          alert('הרכב נשמר אך הייתה שגיאה בהעלאת הקבצים');
        }
      }
      
      setShowCarForm(false);
      setEditingCar(null);
    } catch (error) {
      console.error('Error saving car:', error);
      alert('שגיאה בשמירת הרכב');
    }
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setShowCarForm(true);
  };

  const handleDeleteCar = async (id: string) => {
    try {
      const success = await deleteCar(id);
      if (success) {
        setCars(prev => prev.filter(car => car.id !== id));
      }
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const updatedCar = await updateCar(id, { isActive });
      if (updatedCar) {
        setCars(prev => prev.map(car => car.id === id ? updatedCar : car));
      }
    } catch (error) {
      console.error('Error toggling car status:', error);
    }
  };

  const handleAddNewCar = () => {
    setEditingCar(null);
    setShowCarForm(true);
  };

  const handleCancelForm = () => {
    setShowCarForm(false);
    setEditingCar(null);
    setPendingMediaFiles([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => {}} />;
  }

  const renderPageContent = () => {
    if (showCarForm) {
      return (
        <CarForm
          car={editingCar || undefined}
          onSave={handleSaveCar}
          onCancel={handleCancelForm}
          onMediaChange={setPendingMediaFiles}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard cars={cars} />;
      
      case 'cars':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-darkBlue">ניהול רכבים</h1>
              <button
                onClick={handleAddNewCar}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                הוסף רכב חדש
              </button>
            </div>
            <CarsTable
              cars={cars}
              onEdit={handleEditCar}
              onDelete={handleDeleteCar}
              onToggleActive={handleToggleActive}
            />
          </div>
        );
      
      case 'leads':
        return <LeadsManager />;
      
      case 'whatsapp':
        return <WhatsAppIntegration />;
      
      case 'templates':
        return <WhatsAppTemplates />;
      
      case 'sitemap':
        return <SitemapManager />;
      
      case 'settings':
        return <SettingsManager />;
      
      default:
        return <AdminDashboard cars={cars} />;
    }
  };

  return (
    <AdminLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPageContent()}
    </AdminLayout>
  );
};

const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <AdminAppContent />
    </AuthProvider>
  );
};

export default AdminApp;