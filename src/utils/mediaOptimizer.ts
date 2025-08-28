export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export const optimizeImage = (
  file: File,
  options: OptimizationOptions = {}
): Promise<{ original: string; optimized: string; size: number }> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 800,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const originalUrl = URL.createObjectURL(file);
      const optimizedUrl = canvas.toDataURL(`image/${format}`, quality);
      
      // Calculate compressed size (approximate)
      const compressedSize = Math.round(optimizedUrl.length * 0.75);
      
      resolve({
        original: originalUrl,
        optimized: optimizedUrl,
        size: compressedSize
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB (Supabase limit)
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'הקובץ גדול מדי (מקסימום 5MB)' };
  }
  
  const isImage = allowedImageTypes.includes(file.type);
  const isVideo = allowedVideoTypes.includes(file.type);
  
  if (!isImage && !isVideo) {
    return { valid: false, error: 'סוג קובץ לא נתמך' };
  }
  
  return { valid: true };
};