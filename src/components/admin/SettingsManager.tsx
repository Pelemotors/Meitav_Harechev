import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Globe, Mail, Phone, MessageCircle, FileText, AlertCircle } from 'lucide-react';
import { Button, Card } from '../ui';

interface SystemSettings {
  siteTitle: string;
  contactEmail: string;
  whatsappPhone: string;
  maintenanceMode: boolean;
  aboutPage: string;
  termsPage: string;
  whatsappTemplate: string;
}

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteTitle: 'מיטב הרכב',
    contactEmail: 'info@meitav-harechev.com',
    whatsappPhone: '972505666620',
    maintenanceMode: false,
    aboutPage: '',
    termsPage: '',
    whatsappTemplate: 'שלום! אני מעוניין בפרטים על הרכב: {carName}'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      setMessage({ type: 'error', text: 'שגיאה בטעינת ההגדרות - משתמש בהגדרות מקומיות' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה' });
        // Also save to localStorage as backup
        localStorage.setItem('systemSettings', JSON.stringify(settings));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Fallback to localStorage
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      setMessage({ type: 'error', text: 'שגיאה בשמירת ההגדרות - נשמר מקומית' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePageContentChange = (field: 'aboutPage' | 'termsPage', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-2 text-gray-600">טוען הגדרות...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-darkBlue">הגדרות מערכת</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-darkBlue">הגדרות כלליות</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כותרת האתר
              </label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="כותרת האתר"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline ml-1" />
                אימייל יצירת קשר
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="info@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline ml-1" />
                טלפון WhatsApp
              </label>
              <input
                type="tel"
                value={settings.whatsappPhone}
                onChange={(e) => handleInputChange('whatsappPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="972501234567"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                מצב תחזוקה
              </label>
            </div>
          </div>
        </Card>

        {/* WhatsApp Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-darkBlue">הגדרות WhatsApp</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תבנית הודעה
              </label>
              <textarea
                value={settings.whatsappTemplate}
                onChange={(e) => handleInputChange('whatsappTemplate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="שלום! אני מעוניין בפרטים על הרכב: {carName}"
              />
              <p className="text-xs text-gray-500 mt-1">
                השתמש ב-{'{carName}'} כדי להכניס את שם הרכב אוטומטית
              </p>
            </div>
          </div>
        </Card>

        {/* About Page */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-darkBlue">עמוד אודות</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוכן העמוד
            </label>
            <textarea
              value={settings.aboutPage}
              onChange={(e) => handlePageContentChange('aboutPage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={8}
              placeholder="הזן את תוכן עמוד האודות כאן..."
            />
          </div>
        </Card>

        {/* Terms Page */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-darkBlue">תנאי שימוש</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תוכן העמוד
            </label>
            <textarea
              value={settings.termsPage}
              onChange={(e) => handlePageContentChange('termsPage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={8}
              placeholder="הזן את תנאי השימוש כאן..."
            />
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'שומר...' : 'שמור הגדרות'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsManager;
