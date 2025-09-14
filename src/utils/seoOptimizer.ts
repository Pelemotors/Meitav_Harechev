// מערכת אופטימיזציה SEO
// ניהול Meta tags, Sitemap, ו-Schema markup

export interface SEOMetaData {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
  author?: string;
  language?: string;
}

export interface CarSEOData {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  images: string[];
  url: string;
  category: string;
  condition: 'new' | 'used';
  mileage: number;
  fuelType: string;
  transmission: string;
  color: string;
}

export interface SitemapItem {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SchemaMarkup {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

class SEOOptimizer {
  private baseUrl: string;
  private defaultMeta: SEOMetaData;

  constructor(baseUrl: string = 'https://meitav-harechev.com') {
    this.baseUrl = baseUrl;
    this.defaultMeta = {
      title: 'מיטב הרכב - סוכנות הרכב של חדרה',
      description: 'רכבים לכל כיס החל מ-5,000 ₪ ועד רכבים חדשים ומפוארים. סוכנות משפחתית בחדרה עם שירות אישי.',
      keywords: ['רכבי יוקרה', 'BMW', 'Mercedes', 'Audi', 'רכב משומש', 'רכב חדש', 'מימון רכב'],
      ogType: 'website',
      twitterCard: 'summary_large_image',
      language: 'he'
    };
  }

  // עדכון Meta tags
  updateMetaTags(metaData: Partial<SEOMetaData>): void {
    const meta = { ...this.defaultMeta, ...metaData };

    // עדכון title
    document.title = meta.title;

    // עדכון meta tags בסיסיים
    this.updateMetaTag('description', meta.description);
    this.updateMetaTag('keywords', meta.keywords.join(', '));
    this.updateMetaTag('author', meta.author);
    this.updateMetaTag('robots', meta.robots);
    this.updateMetaTag('language', meta.language);

    // עדכון Open Graph tags
    this.updateMetaTag('og:title', meta.ogTitle || meta.title);
    this.updateMetaTag('og:description', meta.ogDescription || meta.description);
    this.updateMetaTag('og:image', meta.ogImage);
    this.updateMetaTag('og:type', meta.ogType);
    this.updateMetaTag('og:url', meta.canonical || window.location.href);

    // עדכון Twitter Card tags
    this.updateMetaTag('twitter:card', meta.twitterCard);
    this.updateMetaTag('twitter:title', meta.twitterTitle || meta.title);
    this.updateMetaTag('twitter:description', meta.twitterDescription || meta.description);
    this.updateMetaTag('twitter:image', meta.twitterImage || meta.ogImage);

    // עדכון canonical URL
    this.updateCanonicalUrl(meta.canonical);
  }

  // עדכון meta tag יחיד
  private updateMetaTag(name: string, content?: string): void {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  // עדכון canonical URL
  private updateCanonicalUrl(url?: string): void {
    if (!url) return;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  // יצירת Schema markup לרכב
  generateCarSchema(carData: CarSEOData): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: carData.name,
      brand: {
        '@type': 'Brand',
        name: carData.brand
      },
      model: carData.model,
      vehicleModelDate: carData.year.toString(),
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: carData.mileage,
        unitCode: 'SMI' // Statute mile
      },
      color: carData.color,
      fuelType: this.mapFuelType(carData.fuelType),
      transmission: this.mapTransmission(carData.transmission),
      vehicleCondition: carData.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      offers: {
        '@type': 'Offer',
        price: carData.price,
        priceCurrency: 'ILS',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'מיטב הרכב',
          url: this.baseUrl
        }
      },
      image: carData.images,
      description: carData.description,
      url: carData.url
    };
  }

  // מיפוי סוג דלק ל-Schema
  private mapFuelType(fuelType: string): string {
    const fuelMap: { [key: string]: string } = {
      'gasoline': 'https://schema.org/Gasoline',
      'diesel': 'https://schema.org/Diesel',
      'hybrid': 'https://schema.org/Hybrid',
      'electric': 'https://schema.org/Electric'
    };
    return fuelMap[fuelType] || fuelType;
  }

  // מיפוי תיבת הילוכים ל-Schema
  private mapTransmission(transmission: string): string {
    const transmissionMap: { [key: string]: string } = {
      'automatic': 'https://schema.org/AutomaticTransmission',
      'manual': 'https://schema.org/ManualTransmission'
    };
    return transmissionMap[transmission] || transmission;
  }

  // הוספת Schema markup לדף
  addSchemaMarkup(schema: SchemaMarkup): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // יצירת Sitemap
  generateSitemap(items: SitemapItem[]): string {
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

  // יצירת Sitemap דינמי לרכבים
  generateCarsSitemap(cars: CarSEOData[]): string {
    const items: SitemapItem[] = [
      {
        url: `${this.baseUrl}/`,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: `${this.baseUrl}/cars`,
        changefreq: 'hourly',
        priority: 0.9
      },
      ...cars.map(car => ({
        url: car.url,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly' as const,
        priority: 0.8
      }))
    ];

    return this.generateSitemap(items);
  }

  // יצירת Robots.txt
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml
Sitemap: ${this.baseUrl}/sitemap-cars.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Crawl delay
Crawl-delay: 1`;
  }

  // אופטימיזציה של תמונות
  optimizeImages(images: string[]): string[] {
    return images.map(image => {
      // הוספת פרמטרים לאופטימיזציה
      const url = new URL(image);
      url.searchParams.set('w', '800'); // רוחב מקסימלי
      url.searchParams.set('q', '85'); // איכות
      url.searchParams.set('f', 'auto'); // פורמט אוטומטי
      return url.toString();
    });
  }

  // יצירת Meta tags לרכב
  generateCarMetaTags(car: CarSEOData): SEOMetaData {
    const price = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(car.price);

    return {
      title: `${car.name} ${car.year} - ${price} | מיטב הרכב`,
      description: `${car.name} ${car.year} למכירה. ${car.mileage.toLocaleString('he-IL')} ק"מ, ${car.transmission === 'automatic' ? 'אוטומטי' : 'ידני'}, ${car.fuelType}. מחיר: ${price}. רכב ${car.condition === 'new' ? 'חדש' : 'משומש'} במצב מעולה.`,
      keywords: [
        car.name,
        car.brand,
        car.model,
        car.year.toString(),
        'רכב למכירה',
        car.condition === 'new' ? 'רכב חדש' : 'רכב משומש',
        car.transmission === 'automatic' ? 'אוטומטי' : 'ידני',
        car.fuelType,
        'מיטב הרכב'
      ],
      ogTitle: `${car.name} ${car.year} - ${price}`,
      ogDescription: `${car.name} ${car.year} למכירה במחיר ${price}. רכב ${car.condition === 'new' ? 'חדש' : 'משומש'} במצב מעולה.`,
      ogImage: car.images[0],
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: `${car.name} ${car.year} - ${price}`,
      twitterDescription: `${car.name} ${car.year} למכירה במחיר ${price}`,
      twitterImage: car.images[0],
      canonical: car.url,
      language: 'he'
    };
  }

  // יצירת Meta tags לדף חיפוש
  generateSearchMetaTags(query: string, resultsCount: number): SEOMetaData {
    return {
      title: `חיפוש: ${query} - ${resultsCount} רכבים נמצאו | Strong Luxury Cars`,
      description: `חיפוש רכבים: ${query}. נמצאו ${resultsCount} רכבים מתאימים. רכבי יוקרה איכותיים ובדוקים במחירים תחרותיים.`,
      keywords: [
        'חיפוש רכבים',
        query,
        'רכבי יוקרה',
        'רכב למכירה',
        'מיטב הרכב'
      ],
      ogTitle: `חיפוש: ${query} - ${resultsCount} רכבים`,
      ogDescription: `חיפוש רכבים: ${query}. נמצאו ${resultsCount} רכבים מתאימים.`,
      ogType: 'website',
      twitterCard: 'summary',
      canonical: `${this.baseUrl}/search?q=${encodeURIComponent(query)}`,
      language: 'he'
    };
  }

  // יצירת Meta tags לדף השוואה
  generateComparisonMetaTags(cars: CarSEOData[]): SEOMetaData {
    const carNames = cars.map(car => car.name).join(' vs ');
    const prices = cars.map(car => 
      new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0
      }).format(car.price)
    ).join(' - ');

    return {
      title: `השוואת רכבים: ${carNames} | Strong Luxury Cars`,
      description: `השוואה מפורטת בין ${cars.length} רכבים: ${carNames}. מחירים: ${prices}. השוואת מפרטים, מחירים ותכונות.`,
      keywords: [
        'השוואת רכבים',
        ...cars.map(car => car.name),
        'מפרט רכב',
        'מחיר רכב',
        'מיטב הרכב'
      ],
      ogTitle: `השוואת רכבים: ${carNames}`,
      ogDescription: `השוואה מפורטת בין ${cars.length} רכבים. מחירים: ${prices}.`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      canonical: `${this.baseUrl}/compare?cars=${cars.map(car => car.id).join(',')}`,
      language: 'he'
    };
  }

  // הוספת Structured Data
  addStructuredData(data: any): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // יצירת Breadcrumbs Schema
  generateBreadcrumbsSchema(items: { name: string; url: string }[]): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  // יצירת Organization Schema
  generateOrganizationSchema(): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'מיטב הרכב',
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      description: 'רכבים לכל כיס החל מ-5,000 ₪ ועד רכבים חדשים ומפוארים',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IL',
        addressLocality: 'חדרה',
        addressRegion: 'חדרה'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+972-50-1234567',
        contactType: 'customer service',
        availableLanguage: 'Hebrew'
      },
      sameAs: [
        'https://www.facebook.com/strongluxurycars',
        'https://www.instagram.com/strongluxurycars'
      ]
    };
  }

  // בדיקת SEO
  checkSEO(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // בדיקת title
    const title = document.title;
    if (!title || title.length < 10) {
      issues.push('Title חסר או קצר מדי');
      score -= 20;
    } else if (title.length > 60) {
      issues.push('Title ארוך מדי');
      score -= 10;
    }

    // בדיקת description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (!description || description.length < 50) {
      issues.push('Description חסר או קצר מדי');
      score -= 15;
    } else if (description.length > 160) {
      issues.push('Description ארוך מדי');
      score -= 5;
    }

    // בדיקת headings
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push('אין H1 בדף');
      score -= 10;
    } else if (h1s.length > 1) {
      issues.push('יותר מדי H1 בדף');
      score -= 5;
    }

    // בדיקת images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} תמונות ללא alt text`);
      score -= imagesWithoutAlt.length * 2;
    }

    // בדיקת links
    const links = document.querySelectorAll('a');
    const linksWithoutText = Array.from(links).filter(link => !link.textContent?.trim());
    if (linksWithoutText.length > 0) {
      issues.push(`${linksWithoutText.length} קישורים ללא טקסט`);
      score -= linksWithoutText.length * 2;
    }

    // המלצות
    if (score < 80) {
      recommendations.push('שפר את ה-SEO של הדף');
    }
    if (!document.querySelector('link[rel="canonical"]')) {
      recommendations.push('הוסף canonical URL');
    }
    if (!document.querySelector('script[type="application/ld+json"]')) {
      recommendations.push('הוסף Structured Data');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // יצירת URL ידידותי ל-SEO
  generateSEOFriendlyURL(text: string): string {
    return text
      .toLowerCase()
      .replace(/[א-ת]/g, (char) => {
        // מיפוי אותיות עבריות לאותיות לטיניות
        const hebrewToLatin: { [key: string]: string } = {
          'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
          'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
          'כ': 'k', 'ל': 'l', 'מ': 'm', 'נ': 'n', 'ס': 's',
          'ע': 'a', 'פ': 'p', 'צ': 'ts', 'ק': 'k', 'ר': 'r',
          'ש': 'sh', 'ת': 't'
        };
        return hebrewToLatin[char] || char;
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

// יצירת instance גלובלי
export const seoOptimizer = new SEOOptimizer();

// פונקציות עזר
export const seoUtils = {
  // עדכון Meta tags
  updateMeta: (metaData: Partial<SEOMetaData>) => seoOptimizer.updateMetaTags(metaData),

  // יצירת Schema לרכב
  generateCarSchema: (carData: CarSEOData) => seoOptimizer.generateCarSchema(carData),

  // הוספת Schema
  addSchema: (schema: SchemaMarkup) => seoOptimizer.addSchemaMarkup(schema),

  // יצירת Sitemap
  generateSitemap: (items: SitemapItem[]) => seoOptimizer.generateSitemap(items),

  // בדיקת SEO
  checkSEO: () => seoOptimizer.checkSEO(),

  // יצירת URL ידידותי ל-SEO
  generateSEOURL: (text: string) => seoOptimizer.generateSEOFriendlyURL(text)
};

// Hook ל-React לניהול SEO
export const useSEO = () => {
  return {
    updateMeta: (metaData: Partial<SEOMetaData>) => seoOptimizer.updateMetaTags(metaData),
    addSchema: (schema: SchemaMarkup) => seoOptimizer.addSchemaMarkup(schema),
    checkSEO: () => seoOptimizer.checkSEO()
  };
};

export default SEOOptimizer;
