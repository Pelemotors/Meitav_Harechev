import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Calculator, Download, Share2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Car } from '../types';
import { Button, Badge, Card } from './ui';
import CarGallery from './CarGallery';
import CarSpecs from './CarSpecs';
import FinanceCalculator from './FinanceCalculator';
import MarkdownRenderer from './MarkdownRenderer';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'specs' | 'finance' | 'description'>('gallery');

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load car directly from Supabase
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('*')
          .eq('id', id)
          .single();

        if (carError) {
          throw new Error('רכב לא נמצא');
        }

        // Load media files for this car
        const { data: mediaData, error: mediaError } = await supabase
          .from('media_files')
          .select('*')
          .eq('car_id', id)
          .order('created_at', { ascending: false });

        if (mediaError) {
          console.error('Error loading media:', mediaError);
        }

        // Transform the data to match our expected format
        const transformedCar = {
          ...carData,
          mileage: carData.kilometers, // Map kilometers to mileage for compatibility
          images: (mediaData || [])
            .filter((media: any) => media.type === 'image')
            .map((media: any) => media.url),
          video: (mediaData || [])
            .filter((media: any) => media.type === 'video')
            .map((media: any) => media.url)[0],
          createdAt: new Date(carData.created_at),
          updatedAt: new Date(carData.updated_at)
        };
        
        setCar(transformedCar as Car);
      } catch (err) {
        // Fallback to Supabase if API fails
        try {
          const { data, error } = await supabase
            .from('cars')
            .select('*, media_files(*)')
            .eq('id', id)
            .single();

          if (error) {
            throw new Error('רכב לא נמצא');
          }

          setCar(data as Car);
        } catch (fallbackErr) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : 'שגיאה בטעינת הרכב');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsApp = (agent: 'alon' | 'asi') => {
    if (!car) return;
    
    let phoneNumber = '';
    let agentName = '';
    
    if (agent === 'alon') {
      phoneNumber = '972535335540';
      agentName = 'אלון';
    } else if (agent === 'asi') {
      phoneNumber = '972507422522';
      agentName = 'אסי';
    }
    
    const message = `שלום ${agentName}, ראיתי את הרכב ${car.name} באתר שלכם ורציתי לדעת האם הוא עדיין זמין למכירה?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };


  const handleDownloadPDF = () => {
    if (!car) return;
    
    // יצירת PDF דינמי (בעתיד)
    const pdfContent = `
      ${car.name}
      מחיר: ${formatPrice(car.price)}
      שנה: ${car.year}
      קילומטראז': ${car.kilometers?.toLocaleString('he-IL') || 0} ק"מ
    `;
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${car.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: car?.name || 'רכב יוקרה',
          text: `בדוק את הרכב הזה: ${car?.name}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('שגיאה בשיתוף:', error);
      }
    } else {
      // Fallback - העתקת URL
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק ללוח');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-600 hebrew">טוען פרטי רכב...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 hebrew">רכב לא נמצא</h2>
          <p className="text-neutral-600 mb-6 hebrew">{error || 'הרכב המבוקש לא נמצא במערכת'}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזרה
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                שתף
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Car Header */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Car Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="heading-2 text-neutral-900 mb-2 hebrew">{car.name}</h1>
                  <p className="text-neutral-600 hebrew">{car.brand} {car.model}</p>
                </div>
                {car.isActive && (
                  <Badge variant="success">זמין</Badge>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 hebrew">מחיר:</span>
                  <span className="price-text">{formatPrice(car.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 hebrew">שנה:</span>
                  <span className="text-neutral-900 hebrew">{car.year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 hebrew">קילומטראז':</span>
                  <span className="text-neutral-900 hebrew">
                    {car.kilometers?.toLocaleString('he-IL') || 0} ק"מ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 hebrew">תיבת הילוכים:</span>
                  <span className="text-neutral-900 hebrew">
                    {car.transmission === 'automatic' ? 'אוטומטי' : 'ידני'}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">בחר נציג ליצירת קשר:</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleWhatsApp('alon')}
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp - אלון (053-5335540)
                  </Button>
                  
                  <Button
                    variant="primary"
                    onClick={() => handleWhatsApp('asi')}
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp - אסי (050-7422522)
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open('tel:0535335540', '_self')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    התקשר - אלון
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.open('tel:0507422522', '_self')}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    התקשר - אסי
                  </Button>
                </div>
              </div>
              
              <Button
                variant="secondary"
                onClick={() => setActiveTab('finance')}
                className="w-full flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                מחשבון מימון
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'gallery', label: 'גלריה', icon: '🖼️' },
                { id: 'specs', label: 'מפרט טכני', icon: '⚙️' },
                { id: 'finance', label: 'מימון', icon: '💰' },
                { id: 'description', label: 'תיאור', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors
                    ${activeTab === tab.id 
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span className="hebrew">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'gallery' && (
              <CarGallery images={car.images || []} carName={car.name} />
            )}
            
            {activeTab === 'specs' && (
              <CarSpecs car={car} />
            )}
            
            {activeTab === 'finance' && (
              <FinanceCalculator carPrice={car.price} />
            )}
            
            {activeTab === 'description' && (
              <div>
                <h3 className="heading-3 text-neutral-900 mb-4 hebrew">תיאור הרכב</h3>
                {car.description ? (
                  <MarkdownRenderer content={car.description} />
                ) : (
                  <p className="text-neutral-600 hebrew">אין תיאור זמין לרכב זה</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage;
