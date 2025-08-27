import React, { useState, useEffect } from 'react';
import { sitemapUtils } from '../../utils/sitemapGenerator';
import { Button, Card, Badge } from '../ui';
import { Download, RefreshCw, FileText, Settings } from 'lucide-react';

interface SitemapStats {
  totalUrls: number;
  carsCount: number;
  lastGenerated: string;
  fileSize: string;
}

const SitemapManager: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sitemapContent, setSitemapContent] = useState<string>('');
  const [robotsContent, setRobotsContent] = useState<string>('');
  const [stats, setStats] = useState<SitemapStats>({
    totalUrls: 0,
    carsCount: 0,
    lastGenerated: '',
    fileSize: '0 KB'
  });

  // יצירת Sitemap מלא
  const generateFullSitemap = async () => {
    setIsGenerating(true);
    try {
      const sitemap = await sitemapUtils.generateFull();
      setSitemapContent(sitemap);
      
      // חישוב סטטיסטיקות
      const urlCount = (sitemap.match(/<url>/g) || []).length;
      const carsCount = (sitemap.match(/\/car\//g) || []).length;
      const fileSize = new Blob([sitemap]).size;
      
      setStats({
        totalUrls: urlCount,
        carsCount: carsCount,
        lastGenerated: new Date().toLocaleString('he-IL'),
        fileSize: `${(fileSize / 1024).toFixed(1)} KB`
      });
      
      // יצירת Robots.txt
      const robots = sitemapUtils.generateRobots();
      setRobotsContent(robots);
      
    } catch (error) {
      console.error('שגיאה ביצירת Sitemap:', error);
      alert('שגיאה ביצירת Sitemap. אנא נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  // יצירת Sitemap רכבים בלבד
  const generateCarsSitemap = async () => {
    setIsGenerating(true);
    try {
      const sitemap = await sitemapUtils.generateCars();
      setSitemapContent(sitemap);
      
      // חישוב סטטיסטיקות
      const urlCount = (sitemap.match(/<url>/g) || []).length;
      const fileSize = new Blob([sitemap]).size;
      
      setStats({
        totalUrls: urlCount,
        carsCount: urlCount,
        lastGenerated: new Date().toLocaleString('he-IL'),
        fileSize: `${(fileSize / 1024).toFixed(1)} KB`
      });
      
    } catch (error) {
      console.error('שגיאה ביצירת Sitemap רכבים:', error);
      alert('שגיאה ביצירת Sitemap רכבים. אנא נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  // הורדת Sitemap
  const downloadSitemap = () => {
    if (sitemapContent) {
      sitemapUtils.saveSitemap(sitemapContent, 'sitemap.xml');
    }
  };

  // הורדת Robots.txt
  const downloadRobots = () => {
    if (robotsContent) {
      const blob = new Blob([robotsContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'robots.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // יצירת Sitemap Index
  const generateSitemapIndex = () => {
    const sitemaps = [
      { url: `${import.meta.env.VITE_BASE_URL || 'https://strongluxurycars.com'}/sitemap.xml` },
      { url: `${import.meta.env.VITE_BASE_URL || 'https://strongluxurycars.com'}/sitemap-cars.xml` }
    ];
    
    const index = sitemapUtils.generateIndex(sitemaps);
    const blob = new Blob([index], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap-index.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // טעינה ראשונית
  useEffect(() => {
    generateFullSitemap();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">ניהול Sitemap</h2>
        <Badge variant="info" className="text-sm">
          <Settings className="w-4 h-4 mr-1" />
          SEO
        </Badge>
      </div>

      {/* סטטיסטיקות */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">סטטיסטיקות Sitemap</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUrls}</div>
            <div className="text-sm text-gray-600">סה"כ URL-ים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.carsCount}</div>
            <div className="text-sm text-gray-600">רכבים</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{stats.fileSize}</div>
            <div className="text-sm text-gray-600">גודל קובץ</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">{stats.lastGenerated}</div>
            <div className="text-sm text-gray-600">נוצר לאחרונה</div>
          </div>
        </div>
      </Card>

      {/* כפתורי פעולה */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">פעולות Sitemap</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={generateFullSitemap}
            disabled={isGenerating}
            className="w-full"
            variant="primary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            יצירת Sitemap מלא
          </Button>
          
          <Button
            onClick={generateCarsSitemap}
            disabled={isGenerating}
            className="w-full"
            variant="secondary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Sitemap רכבים בלבד
          </Button>
          
          <Button
            onClick={downloadSitemap}
            disabled={!sitemapContent}
            className="w-full"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            הורדת Sitemap
          </Button>
          
          <Button
            onClick={downloadRobots}
            disabled={!robotsContent}
            className="w-full"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            הורדת Robots.txt
          </Button>
        </div>
      </Card>

      {/* כלים נוספים */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">כלים נוספים</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Sitemap Index</h4>
            <p className="text-sm text-gray-600 mb-3">
              יצירת קובץ Sitemap Index שמכיל הפניות לכל ה-Sitemaps באתר
            </p>
            <Button
              onClick={generateSitemapIndex}
              variant="outline"
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              יצירת Sitemap Index
            </Button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">הגדרות SEO</h4>
            <p className="text-sm text-gray-600 mb-3">
              הגדרת Base URL ופרמטרים נוספים ל-Sitemap
            </p>
            <div className="text-sm bg-gray-50 p-3 rounded">
              <strong>Base URL:</strong> {import.meta.env.VITE_BASE_URL || 'https://strongluxurycars.com'}
            </div>
          </div>
        </div>
      </Card>

      {/* תצוגה מקדימה */}
      {sitemapContent && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">תצוגה מקדימה - Sitemap</h3>
          <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {sitemapContent}
            </pre>
          </div>
        </Card>
      )}

      {/* תצוגה מקדימה Robots.txt */}
      {robotsContent && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">תצוגה מקדימה - Robots.txt</h3>
          <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {robotsContent}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SitemapManager;
