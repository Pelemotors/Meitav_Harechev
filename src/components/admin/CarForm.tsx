import React, { useState, useRef } from 'react';
import { Car, MediaFile } from '../../types';
import { Upload, X, Play, Image as ImageIcon } from 'lucide-react';
import { validateMediaFile } from '../../utils/mediaOptimizer';
import { uploadMediaFile, deleteMediaFile } from '../../utils/storage';
import ManufacturerModelSelector from '../ManufacturerModelSelector';

interface CarFormProps {
  car?: Car;
  onSave: (car: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onMediaChange?: (files: File[]) => void;
}

const CarForm: React.FC<CarFormProps> = ({ car, onSave, onCancel, onMediaChange }) => {
  const [formData, setFormData] = useState({
    brand: car?.brand || '',
    model: car?.model || '',
    year: car?.year || new Date().getFullYear(),
    price: car?.price || 0,
    kilometers: car?.kilometers || 0,
    transmission: car?.transmission || 'automatic' as const,
    fuelType: car?.fuelType || 'gasoline' as const,
    color: car?.color || '',
    description: car?.description || '',
    features: car?.features || [],
    images: car?.images || [],
    video: car?.video || '',
    isActive: car?.isActive ?? true
  });

  const [newFeature, setNewFeature] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (formData.images.length >= 4) {
      alert('ניתן להעלות עד 4 תמונות בלבד');
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < Math.min(files.length, 4 - formData.images.length); i++) {
        const file = files[i];
        const validation = validateMediaFile(file);
        
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        if (file.type.startsWith('image/')) {
          // For now, we'll store the file for later upload when car is saved
          const tempUrl = URL.createObjectURL(file);
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, tempUrl]
          }));
          
          // Store the file for later upload
          setUploadedMedia(prev => [...prev, {
            id: `temp-${Date.now()}-${i}`,
            filename: '',
            originalName: file.name,
            size: file.size,
            type: 'image',
            url: tempUrl,
            carId: car?.id,
            createdAt: new Date(),
            file: file // Store the actual file
          } as any]);
          
          // Also add to pending media files for the parent component
          if (onMediaChange) {
            onMediaChange(prev => [...prev, file]);
          }
        }
      }
    } catch (error) {
      console.error('Error processing images:', error);
      alert('שגיאה בעיבוד התמונות');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    const validation = validateMediaFile(file);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (file.type.startsWith('video/')) {
      const tempUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        video: tempUrl
      }));
      
      // Store the file for later upload
      setUploadedMedia(prev => [...prev, {
        id: `temp-video-${Date.now()}`,
        filename: '',
        originalName: file.name,
        size: file.size,
        type: 'video',
        url: tempUrl,
        carId: car?.id,
        createdAt: new Date(),
        file: file // Store the actual file
      } as any]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    // Remove from uploaded media as well
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First save the car to get the carId
      const carData = { ...formData };
      
      // Call onSave with the car data
      await onSave(carData);
      
      // Note: The actual file upload will happen in the parent component
      // after the car is saved and we have the carId
    } catch (error) {
      console.error('Error saving car:', error);
      alert('שגיאה בשמירת הרכב');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-right">
        {car ? 'עריכת רכב' : 'הוספת רכב חדש'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm text-right">
            💡 <strong>טיפ:</strong> שם הרכב ייווצר אוטומטית מיצרן + דגם + שנת ייצור
          </p>
        </div>
        
        {/* בחירת יצרן ודגם */}
        <div className="mb-6">
          <ManufacturerModelSelector
            selectedManufacturer={formData.brand}
            selectedModel={formData.model}
            onManufacturerChange={(manufacturer) => 
              setFormData(prev => ({ ...prev, brand: manufacturer }))
            }
            onModelChange={(model) => 
              setFormData(prev => ({ ...prev, model: model }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              שנה *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              min="1990"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              מחיר (₪) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              קילומטרים *
            </label>
            <input
              type="number"
              name="kilometers"
              value={formData.kilometers}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder="45000"
            />
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              תיבת הילוכים *
            </label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            >
              <option value="automatic">אוטומטי</option>
              <option value="manual">ידני</option>
            </select>
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              סוג דלק *
            </label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            >
              <option value="gasoline">בנזין</option>
              <option value="diesel">דיזל</option>
              <option value="hybrid">היברידי</option>
              <option value="electric">חשמלי</option>
            </select>
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-2">
              צבע *
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder="לבן, שחור, כחול..."
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-gray-700 font-medium">רכב פעיל</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-right text-gray-700 font-medium mb-2">
            תיאור הרכב
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right resize-none"
            placeholder="תיאור מפורט של הרכב, מצבו, ותכונות מיוחדות..."
          />
        </div>

        {/* Features */}
        <div>
          <label className="block text-right text-gray-700 font-medium mb-2">
            תכונות הרכב
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={handleAddFeature}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              הוסף
            </button>
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              placeholder="הוסף תכונה חדשה..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(feature)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images Upload */}
        <div>
          <label className="block text-right text-gray-700 font-medium mb-2">
            תמונות הרכב (עד 4 תמונות)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`תמונה ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {formData.images.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">הוסף תמונה</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-right text-gray-700 font-medium mb-2">
            סרטון הרכב (אופציונלי)
          </label>
          {formData.video ? (
            <div className="relative">
              <video
                src={formData.video}
                controls
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, video: '' }))}
                className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full max-w-md h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
            >
              <Play className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">הוסף סרטון</span>
            </button>
          )}
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {car ? 'עדכן רכב' : 'הוסף רכב'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CarForm;