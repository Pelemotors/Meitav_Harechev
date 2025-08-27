import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download } from 'lucide-react';
import { Button } from './ui';

interface CarGalleryProps {
  images: string[];
  carName: string;
}

const CarGallery: React.FC<CarGalleryProps> = ({ images, carName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  const defaultImage = 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800';

  const displayImages = images.length > 0 ? images : [defaultImage];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setShowLightbox(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setIsZoomed(false);
    document.body.style.overflow = 'unset';
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % displayImages.length);
    setIsZoomed(false);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showLightbox) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowRight':
        nextLightboxImage();
        break;
      case 'ArrowLeft':
        prevLightboxImage();
        break;
      case 'z':
      case 'Z':
        toggleZoom();
        break;
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${carName}_image_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showLightbox]);

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <div className="relative bg-slc-white rounded-xl overflow-hidden shadow-lg">
        <div className="relative aspect-video">
          <img
            ref={imageRef}
            src={displayImages[currentIndex]}
            alt={`${carName} - תמונה ${currentIndex + 1}`}
            className={`
              w-full h-full object-cover transition-all duration-300
              ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}
            `}
            onClick={toggleZoom}
          />
          
          {/* Image Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadImage(displayImages[currentIndex], currentIndex)}
              className="bg-slc-white/80 hover:bg-slc-white text-slc-dark"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleZoom}
              className="bg-slc-white/80 hover:bg-slc-white text-slc-dark"
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-slc-white/80 hover:bg-slc-white text-slc-dark p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-slc-white/80 hover:bg-slc-white text-slc-dark p-2 rounded-full shadow-lg transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 bg-slc-dark/80 text-slc-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {displayImages.map((image, index) => (
            <div
              key={index}
              className={`
                relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                ${currentIndex === index 
                  ? 'ring-2 ring-slc-bronze scale-105' 
                  : 'hover:scale-105'
                }
              `}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={image}
                alt={`${carName} - תמונה ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Click to open lightbox */}
              <div 
                className="absolute inset-0 bg-slc-dark/0 hover:bg-slc-dark/20 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(index);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-slc-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-slc-white hover:text-slc-bronze z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image */}
            <div className="relative max-w-4xl max-h-full p-4">
              <img
                src={displayImages[lightboxIndex]}
                alt={`${carName} - תמונה ${lightboxIndex + 1}`}
                className={`
                  max-w-full max-h-full object-contain transition-all duration-300
                  ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}
                `}
                onClick={toggleZoom}
              />
            </div>

            {/* Lightbox Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleZoom}
                className="text-slc-white hover:text-slc-bronze"
              >
                {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadImage(displayImages[lightboxIndex], lightboxIndex)}
                className="text-slc-white hover:text-slc-bronze"
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prevLightboxImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slc-white hover:text-slc-bronze"
                >
                  <ChevronLeft className="w-12 h-12" />
                </button>
                
                <button
                  onClick={nextLightboxImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slc-white hover:text-slc-bronze"
                >
                  <ChevronRight className="w-12 h-12" />
                </button>
              </>
            )}

            {/* Lightbox Counter */}
            <div className="absolute top-4 left-4 text-slc-white text-lg">
              {lightboxIndex + 1} / {displayImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-slc-gray text-sm hebrew">
        <p>לחץ על התמונה להגדלה • השתמש במקשי החצים לניווט • ESC לסגירה</p>
      </div>
    </div>
  );
};

export default CarGallery;
