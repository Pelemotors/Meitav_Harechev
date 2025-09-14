import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';

interface Manufacturer {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
}

interface ManufacturersData {
  manufacturers: Manufacturer[];
  models: { [manufacturerName: string]: Model[] };
}

interface ManufacturerModelSelectorProps {
  selectedManufacturer?: string;
  selectedModel?: string;
  onManufacturerChange: (manufacturer: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const ManufacturerModelSelector: React.FC<ManufacturerModelSelectorProps> = ({
  selectedManufacturer = '',
  selectedModel = '',
  onManufacturerChange,
  onModelChange,
  disabled = false,
  required = false
}) => {
  const [data, setData] = useState<ManufacturersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('./data/manufacturers_models.json');
        if (!response.ok) {
          throw new Error(`שגיאה בטעינת נתוני היצרנים והדגמים: ${response.status}`);
        }
        const manufacturersData = await response.json();
        setData(manufacturersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleManufacturerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturer = event.target.value;
    onManufacturerChange(manufacturer);
    onModelChange(''); // איפוס הדגם כשמשנים יצרן
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(event.target.value);
  };

  const availableModels = selectedManufacturer && data 
    ? data.models[selectedManufacturer] || []
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2">טוען נתונים...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">לא נמצאו נתונים</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* בחירת יצרן */}
      <div>
        <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
          יצרן {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="manufacturer"
          value={selectedManufacturer}
          onChange={handleManufacturerChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">בחר יצרן</option>
          {data.manufacturers
            .sort((a, b) => a.name.localeCompare(b.name, 'he'))
            .map((manufacturer) => (
              <option key={manufacturer.id} value={manufacturer.name}>
                {manufacturer.name}
              </option>
            ))}
        </select>
      </div>

      {/* בחירת דגם */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          דגם {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={disabled || !selectedManufacturer}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">בחר דגם</option>
          {availableModels
            .sort((a, b) => a.name.localeCompare(b.name, 'he'))
            .map((model) => (
              <option key={model.id} value={model.name}>
                {model.name}
              </option>
            ))}
        </select>
      </div>

      {/* מידע על הבחירה */}
      {selectedManufacturer && selectedModel && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            <strong>נבחר:</strong> {selectedManufacturer} - {selectedModel}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManufacturerModelSelector;
