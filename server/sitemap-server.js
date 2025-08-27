const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// יצירת Sitemap XML
function generateSitemapXML(items) {
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

// יצירת Robots.txt
function generateRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-cars.xml

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

// יצירת Sitemap Index
function generateSitemapIndex(sitemaps, baseUrl) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.url}</loc>
    ${sitemap.lastmod ? `    <lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return xml;
}

// Route ליצירת Sitemap מלא
app.get('/api/sitemap', async (req, res) => {
  try {
    const baseUrl = process.env.VITE_BASE_URL || 'https://strongluxurycars.com';
    
    // קבלת כל הרכבים הפעילים
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, updatedAt')
      .eq('isActive', true)
      .order('updatedAt', { ascending: false });

    if (error) {
      console.error('שגיאה בקבלת רכבים:', error);
      throw error;
    }

    // יצירת רשימת URL-ים
    const sitemapItems = [
      // דף הבית
      {
        url: baseUrl,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      },
      // דף הרכבים
      {
        url: `${baseUrl}/cars`,
        changefreq: 'hourly',
        priority: 0.9,
        lastmod: new Date().toISOString()
      }
    ];

    // הוספת דפי רכבים בודדים
    if (cars && cars.length > 0) {
      cars.forEach(car => {
        sitemapItems.push({
          url: `${baseUrl}/car/${car.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: car.updatedAt ? new Date(car.updatedAt).toISOString() : new Date().toISOString()
        });
      });
    }

    const sitemapXML = generateSitemapXML(sitemapItems);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache לשעה
    res.send(sitemapXML);
    
  } catch (error) {
    console.error('שגיאה ביצירת Sitemap:', error);
    res.status(500).json({ error: 'שגיאה ביצירת Sitemap' });
  }
});

// Route ליצירת Sitemap רכבים בלבד
app.get('/api/sitemap-cars', async (req, res) => {
  try {
    const baseUrl = process.env.VITE_BASE_URL || 'https://strongluxurycars.com';
    
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, updatedAt')
      .eq('isActive', true)
      .order('updatedAt', { ascending: false });

    if (error) {
      console.error('שגיאה בקבלת רכבים:', error);
      throw error;
    }

    const sitemapItems = cars?.map(car => ({
      url: `${baseUrl}/car/${car.id}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: car.updatedAt ? new Date(car.updatedAt).toISOString() : new Date().toISOString()
    })) || [];

    const sitemapXML = generateSitemapXML(sitemapItems);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(sitemapXML);
    
  } catch (error) {
    console.error('שגיאה ביצירת Sitemap רכבים:', error);
    res.status(500).json({ error: 'שגיאה ביצירת Sitemap רכבים' });
  }
});

// Route ליצירת Sitemap Index
app.get('/api/sitemap-index', (req, res) => {
  try {
    const baseUrl = process.env.VITE_BASE_URL || 'https://strongluxurycars.com';
    const now = new Date().toISOString();
    
    const sitemaps = [
      { url: `${baseUrl}/sitemap.xml`, lastmod: now },
      { url: `${baseUrl}/sitemap-cars.xml`, lastmod: now }
    ];
    
    const indexXML = generateSitemapIndex(sitemaps, baseUrl);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(indexXML);
    
  } catch (error) {
    console.error('שגיאה ביצירת Sitemap Index:', error);
    res.status(500).json({ error: 'שגיאה ביצירת Sitemap Index' });
  }
});

// Route ליצירת Robots.txt
app.get('/api/robots', (req, res) => {
  try {
    const baseUrl = process.env.VITE_BASE_URL || 'https://strongluxurycars.com';
    const robotsTxt = generateRobotsTxt(baseUrl);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache ליום
    res.send(robotsTxt);
    
  } catch (error) {
    console.error('שגיאה ביצירת Robots.txt:', error);
    res.status(500).json({ error: 'שגיאה ביצירת Robots.txt' });
  }
});

// Route לסטטיסטיקות Sitemap
app.get('/api/sitemap-stats', async (req, res) => {
  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id')
      .eq('isActive', true);

    if (error) {
      throw error;
    }

    const stats = {
      totalUrls: (cars?.length || 0) + 2, // +2 עבור דף הבית ודף הרכבים
      carsCount: cars?.length || 0,
      lastGenerated: new Date().toISOString(),
      baseUrl: process.env.VITE_BASE_URL || 'https://strongluxurycars.com'
    };

    res.json(stats);
    
  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות:', error);
    res.status(500).json({ error: 'שגיאה בקבלת סטטיסטיקות' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sitemap server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- GET /api/sitemap - Full sitemap`);
  console.log(`- GET /api/sitemap-cars - Cars sitemap`);
  console.log(`- GET /api/sitemap-index - Sitemap index`);
  console.log(`- GET /api/robots - Robots.txt`);
  console.log(`- GET /api/sitemap-stats - Sitemap statistics`);
});
