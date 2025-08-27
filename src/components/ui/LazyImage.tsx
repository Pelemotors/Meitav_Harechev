import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFiYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkqE8L3RleHQ+PC9zdmc+',
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVlMmU1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2M1MzUyYiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfkqE8L3RleHQ+PC9zdmc+',
  width,
  height,
  objectFit = 'cover',
  priority = false,
  onLoad,
  onError,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // יצירת Intersection Observer
  const createObserver = useCallback(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback לדפדפנים ישנים
      setIsInView(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // טעינה מוקדמת של 50px
        threshold: 0.01
      }
    );
  }, []);

  // התחלת מעקב אחרי התמונה
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    createObserver();

    if (imgRef.current && observerRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, createObserver]);

  // טעינת התמונה כאשר היא נראית
  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      setCurrentSrc(src);
    }
  }, [isInView, src, isLoaded, hasError]);

  // טיפול בטעינת התמונה
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // טיפול בשגיאת טעינה
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
    setCurrentSrc(fallback);
    onError?.();
  }, [fallback, onError]);

  // יצירת תמונת placeholder
  const createPlaceholderImage = (text: string, bgColor: string, textColor: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return placeholder;

    canvas.width = 400;
    canvas.height = 300;

    // רקע
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // טקסט
    ctx.fillStyle = textColor;
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  };

  // יצירת placeholder דינמי
  const generatePlaceholder = () => {
    if (placeholder.startsWith('data:')) return placeholder;
    
    return createPlaceholderImage(
      'טוען...',
      '#f3f4f6',
      '#9ca3bb'
    );
  };

  // יצירת fallback דינמי
  const generateFallback = () => {
    if (fallback.startsWith('data:')) return fallback;
    
    return createPlaceholderImage(
      'שגיאה בטעינה',
      '#fee2e5',
      '#c5352b'
    );
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: width || '100%',
    height: height || 'auto',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0
  };

  return (
    <div 
      className={`lazy-image-container ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      {/* תמונת placeholder */}
      {!isLoaded && !hasError && (
        <img
          src={generatePlaceholder()}
          alt=""
          style={{
            ...imageStyle,
            opacity: 1,
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      )}

      {/* אינדיקטור טעינה */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <Loader2 className="w-6 h-6 text-slc-bronze animate-spin" />
        </div>
      )}

      {/* התמונה האמיתית */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className="lazy-image"
        style={imageStyle}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* תמונת fallback */}
      {hasError && (
        <img
          src={generateFallback()}
          alt="שגיאה בטעינה"
          style={{
            ...imageStyle,
            opacity: 1,
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;
