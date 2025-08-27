import { supabase } from './supabase';
import { Car } from '../types';

export interface SitemapItem {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultPriority?: number;
  defaultChangeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export class SitemapGenerator {
  private config: SitemapConfig;

  constructor(config: SitemapConfig) {
    this.config = {
      defaultPriority: 0.5,
      defaultChangeFreq: 'weekly',
      ...config
    };
  }

  // יצירת Sitemap XML
  generateSitemapXML(items: SitemapItem[]): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.map(item => `  <url>
    <loc>${item.url}</loc>
    ${item.lastmod ? `    <lastmod>${item.lastmod}</lastmod>` : ''}
    ${item.changefreq ? `    <changefreq>${item.changefreq}</changefreq>` : ''}
    ${item.priority ? `    <priority>${item.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  // יצירת Sitemap דינמי מלא
  async generateFullSitemap(): Promise<string> {
    try {
      // קבלת כל הרכבים הפעילים
      const { data: cars, error } = await supabase
        .from('cars')
        .select('id, name, brand, model, year, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('שגיאה בקבלת רכבים:', error);
        throw error;
      }

      // יצירת רשימת URL-ים
      const sitemapItems: SitemapItem[] = [
        // דף הבית
        {
          url: this.config.baseUrl,
          changefreq: 'daily',
          priority: 1.0,
          lastmod: new Date().toISOString()
        },
        // דף הרכבים
        {
          url: `${this.config.baseUrl}/cars`,
          changefreq: 'hourly',
          priority: 0.9,
          lastmod: new Date().toISOString()
        }
      ];

      // הוספת דפי רכבים בודדים
      if (cars && cars.length > 0) {
        cars.forEach(car => {
          sitemapItems.push({
            url: `${this.config.baseUrl}/car/${car.id}`,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: car.updated_at ? new Date(car.updated_at).toISOString() : new Date().toISOString()
          });
        });
      }

      return this.generateSitemapXML(sitemapItems);
    } catch (error) {
      console.error('שגיאה ביצירת Sitemap:', error);
      // החזרת Sitemap בסיסי במקרה של שגיאה
      return this.generateBasicSitemap();
    }
  }

  // יצירת Sitemap בסיסי (גיבוי)
  generateBasicSitemap(): string {
    const basicItems: SitemapItem[] = [
      {
        url: this.config.baseUrl,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      },
      {
        url: `${this.config.baseUrl}/cars`,
        changefreq: 'hourly',
        priority: 0.9,
        lastmod: new Date().toISOString()
      }
    ];

    return this.generateSitemapXML(basicItems);
  }

  // יצירת Sitemap לרכבים בלבד
  async generateCarsSitemap(): Promise<string> {
    try {
      const { data: cars, error } = await supabase
        .from('cars')
        .select('id, updatedAt')
        .eq('isActive', true)
        .order('updatedAt', { ascending: false });

      if (error) {
        console.error('שגיאה בקבלת רכבים:', error);
        throw error;
      }

      const sitemapItems: SitemapItem[] = cars?.map(car => ({
        url: `${this.config.baseUrl}/car/${car.id}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: car.updatedAt ? new Date(car.updatedAt).toISOString() : new Date().toISOString()
      })) || [];

      return this.generateSitemapXML(sitemapItems);
    } catch (error) {
      console.error('שגיאה ביצירת Sitemap רכבים:', error);
      return this.generateSitemapXML([]);
    }
  }

  // יצירת Robots.txt
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.config.baseUrl}/sitemap.xml
Sitemap: ${this.config.baseUrl}/sitemap-cars.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Crawl delay
Crawl-delay: 1

# Allow images and media
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.png
Allow: /*.gif
Allow: /*.webp`;
  }

  // שמירת Sitemap לקובץ
  async saveSitemapToFile(sitemapContent: string, filename: string = 'sitemap.xml'): Promise<void> {
    try {
      // יצירת Blob עם התוכן
      const blob = new Blob([sitemapContent], { type: 'application/xml' });
      
      // יצירת URL להורדה
      const url = URL.createObjectURL(blob);
      
      // יצירת קישור להורדה
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ניקוי URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('שגיאה בשמירת Sitemap:', error);
    }
  }

  // יצירת Sitemap Index (למקרה של מספר Sitemaps)
  generateSitemapIndex(sitemaps: Array<{ url: string; lastmod?: string }>): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.url}</loc>
    ${sitemap.lastmod ? `    <lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`).join('\n')}
</sitemapindex>`;

    return xml;
  }
}

// יצירת instance גלובלי
export const sitemapGenerator = new SitemapGenerator({
  baseUrl: import.meta.env.VITE_BASE_URL || 'https://strongluxurycars.com'
});

// פונקציות עזר לייצוא
export const sitemapUtils = {
  // יצירת Sitemap מלא
  generateFull: () => sitemapGenerator.generateFullSitemap(),
  
  // יצירת Sitemap רכבים
  generateCars: () => sitemapGenerator.generateCarsSitemap(),
  
  // יצירת Robots.txt
  generateRobots: () => sitemapGenerator.generateRobotsTxt(),
  
  // שמירת Sitemap
  saveSitemap: (content: string, filename?: string) => sitemapGenerator.saveSitemapToFile(content, filename),
  
  // יצירת Sitemap Index
  generateIndex: (sitemaps: Array<{ url: string; lastmod?: string }>) => sitemapGenerator.generateSitemapIndex(sitemaps)
};
