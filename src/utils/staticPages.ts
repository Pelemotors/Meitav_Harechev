// מערכת ניהול דפים סטטיים
// ניהול דפי אודות, תנאים, פרטיות ותוכן דינמי

import { supabase } from './supabase';
import { seoOptimizer, seoUtils } from './seoOptimizer';

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  isPublished: boolean;
  isPublic: boolean;
  template: 'default' | 'about' | 'terms' | 'privacy' | 'contact' | 'custom';
  layout: 'full-width' | 'sidebar' | 'narrow';
  featuredImage?: string;
  author?: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  language: 'he' | 'en' | 'ar';
  tags: string[];
  category: string;
  seoData?: {
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: string;
    structuredData?: any;
  };
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  slug: string;
  content: string;
  isDefault: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PageRevision {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  author: string;
  createdAt: Date;
  changes: string[];
}

export interface StaticPageFilter {
  isPublished?: boolean;
  isPublic?: boolean;
  template?: string;
  language?: string;
  category?: string;
  tags?: string[];
  search?: string;
}

class StaticPageManager {
  // יצירת דף סטטי חדש
  async createStaticPage(page: Partial<StaticPage>): Promise<StaticPage> {
    try {
      // יצירת slug אוטומטי אם לא סופק
      if (!page.slug) {
        page.slug = this.generateSlug(page.title || '');
      }

      // יצירת meta tags אוטומטיים אם לא סופקו
      if (!page.metaTitle) {
        page.metaTitle = page.title;
      }
      if (!page.metaDescription) {
        page.metaDescription = this.generateMetaDescription(page.content || '');
      }
      if (!page.metaKeywords) {
        page.metaKeywords = this.extractKeywords(page.content || '');
      }

      const staticPage: Partial<StaticPage> = {
        ...page,
        isPublished: page.isPublished ?? false,
        isPublic: page.isPublic ?? true,
        template: page.template || 'default',
        layout: page.layout || 'full-width',
        version: 1,
        language: page.language || 'he',
        tags: page.tags || [],
        category: page.category || 'general',
        lastModified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data, error } = await supabase
        .from('static_pages')
        .insert([staticPage])
        .select()
        .single();

      if (error) throw error;

      // יצירת revision ראשון
      await this.createRevision(data.id, {
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        author: data.author || 'system',
        changes: ['יצירת דף חדש']
      });

      // עדכון SEO
      await this.updateSEOForPage(data);

      return data as StaticPage;
    } catch (error) {
      console.error('שגיאה ביצירת דף סטטי:', error);
      throw error;
    }
  }

  // עדכון דף סטטי
  async updateStaticPage(id: string, updates: Partial<StaticPage>): Promise<StaticPage> {
    try {
      // קבלת הדף הנוכחי
      const { data: currentPage } = await supabase
        .from('static_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (!currentPage) throw new Error('דף לא נמצא');

      // עדכון meta tags אם התוכן השתנה
      if (updates.content && updates.content !== currentPage.content) {
        if (!updates.metaDescription) {
          updates.metaDescription = this.generateMetaDescription(updates.content);
        }
        if (!updates.metaKeywords) {
          updates.metaKeywords = this.extractKeywords(updates.content);
        }
      }

      updates.version = currentPage.version + 1;
      updates.lastModified = new Date();
      updates.updatedAt = new Date();

      const { data, error } = await supabase
        .from('static_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // יצירת revision
      const changes = this.detectChanges(currentPage, updates);
      await this.createRevision(id, {
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        author: updates.author || currentPage.author || 'system',
        changes
      });

      // עדכון SEO
      await this.updateSEOForPage(data);

      return data as StaticPage;
    } catch (error) {
      console.error('שגיאה בעדכון דף סטטי:', error);
      throw error;
    }
  }

  // מחיקת דף סטטי
  async deleteStaticPage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('static_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('שגיאה במחיקת דף סטטי:', error);
      throw error;
    }
  }

  // קבלת דף סטטי לפי slug
  async getStaticPageBySlug(slug: string, language: string = 'he'): Promise<StaticPage | null> {
    try {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('slug', slug)
        .eq('language', language)
        .eq('isPublished', true)
        .eq('isPublic', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // לא נמצא
        throw error;
      }

      // עדכון SEO
      await this.updateSEOForPage(data);

      return data as StaticPage;
    } catch (error) {
      console.error('שגיאה בקבלת דף סטטי:', error);
      return null;
    }
  }

  // קבלת דף סטטי לפי ID
  async getStaticPageById(id: string): Promise<StaticPage | null> {
    try {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as StaticPage;
    } catch (error) {
      console.error('שגיאה בקבלת דף סטטי:', error);
      return null;
    }
  }

  // קבלת דפים סטטיים עם סינון
  async getStaticPages(filter: StaticPageFilter = {}): Promise<StaticPage[]> {
    try {
      let query = supabase
        .from('static_pages')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (filter.isPublished !== undefined) {
        query = query.eq('isPublished', filter.isPublished);
      }

      if (filter.isPublic !== undefined) {
        query = query.eq('isPublic', filter.isPublic);
      }

      if (filter.template) {
        query = query.eq('template', filter.template);
      }

      if (filter.language) {
        query = query.eq('language', filter.language);
      }

      if (filter.category) {
        query = query.eq('category', filter.category);
      }

      if (filter.tags && filter.tags.length > 0) {
        const tagConditions = filter.tags.map(tag => 
          `tags.cs.{${tag}}`
        );
        query = query.or(tagConditions.join(','));
      }

      if (filter.search) {
        query = query.or(`
          title.ilike.%${filter.search}%,
          content.ilike.%${filter.search}%,
          metaTitle.ilike.%${filter.search}%,
          metaDescription.ilike.%${filter.search}%
        `);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as StaticPage[];
    } catch (error) {
      console.error('שגיאה בקבלת דפים סטטיים:', error);
      throw error;
    }
  }

  // יצירת תבנית דף
  async createPageTemplate(template: Partial<PageTemplate>): Promise<PageTemplate> {
    try {
      const pageTemplate: Partial<PageTemplate> = {
        ...template,
        isDefault: template.isDefault || false,
        variables: template.variables || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { data, error } = await supabase
        .from('page_templates')
        .insert([pageTemplate])
        .select()
        .single();

      if (error) throw error;

      return data as PageTemplate;
    } catch (error) {
      console.error('שגיאה ביצירת תבנית דף:', error);
      throw error;
    }
  }

  // קבלת תבניות דף
  async getPageTemplates(): Promise<PageTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data as PageTemplate[];
    } catch (error) {
      console.error('שגיאה בקבלת תבניות דף:', error);
      throw error;
    }
  }

  // יצירת revision
  async createRevision(pageId: string, revision: Partial<PageRevision>): Promise<PageRevision> {
    try {
      const pageRevision: Partial<PageRevision> = {
        pageId,
        version: revision.version || 1,
        title: revision.title || '',
        content: revision.content || '',
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
        metaKeywords: revision.metaKeywords,
        author: revision.author || 'system',
        changes: revision.changes || [],
        createdAt: new Date()
      };

      const { data, error } = await supabase
        .from('page_revisions')
        .insert([pageRevision])
        .select()
        .single();

      if (error) throw error;

      return data as PageRevision;
    } catch (error) {
      console.error('שגיאה ביצירת revision:', error);
      throw error;
    }
  }

  // קבלת revisions של דף
  async getPageRevisions(pageId: string): Promise<PageRevision[]> {
    try {
      const { data, error } = await supabase
        .from('page_revisions')
        .select('*')
        .eq('pageId', pageId)
        .order('version', { ascending: false });

      if (error) throw error;

      return data as PageRevision[];
    } catch (error) {
      console.error('שגיאה בקבלת revisions:', error);
      throw error;
    }
  }

  // שחזור דף ל-revision קודם
  async restoreRevision(pageId: string, version: number): Promise<StaticPage> {
    try {
      const { data: revision } = await supabase
        .from('page_revisions')
        .select('*')
        .eq('pageId', pageId)
        .eq('version', version)
        .single();

      if (!revision) throw new Error('Revision לא נמצא');

      const updates: Partial<StaticPage> = {
        title: revision.title,
        content: revision.content,
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
        metaKeywords: revision.metaKeywords,
        version: revision.version + 1,
        lastModified: new Date(),
        updatedAt: new Date()
      };

      return await this.updateStaticPage(pageId, updates);
    } catch (error) {
      console.error('שגיאה בשחזור revision:', error);
      throw error;
    }
  }

  // יצירת דפים סטטיים ברירת מחדל
  async createDefaultPages(): Promise<void> {
    const defaultPages = [
      {
        slug: 'about',
        title: 'אודות Strong Luxury Cars',
        content: `
# אודות Strong Luxury Cars

ברוכים הבאים ל-Strong Luxury Cars - בית לרכבי יוקרה איכותיים ובדוקים.

## מי אנחנו

Strong Luxury Cars היא חברה מובילה בתחום רכבי היוקרה בישראל. אנו מתמחים במכירה של רכבי יוקרה חדשים ומשומשים ממותגים מובילים כמו BMW, Mercedes, Audi ועוד.

## החזון שלנו

אנו מאמינים שכל אחד ראוי לחוויית נהיגה יוקרתית ומתקדמת. לכן אנו מציעים רכבים איכותיים במחירים תחרותיים, עם שירות מקצועי ואדיב.

## השירותים שלנו

- **רכבי יוקרה חדשים ומשומשים** - מבחר רחב של רכבי יוקרה ממותגים מובילים
- **בדיקה מקיפה** - כל רכב עובר בדיקה מקיפה לפני המכירה
- **מימון מותאם** - פתרונות מימון גמישים ומתאימים
- **שירות לאחר המכירה** - תמיכה מלאה לאחר הרכישה
- **אחריות** - אחריות מקיפה על כל הרכבים

## הצוות שלנו

הצוות המקצועי שלנו כולל מומחי רכב מנוסים, יועצי מכירות מקצועיים וטכנאים מוסמכים. כולנו מחויבים לספק לכם את השירות הטוב ביותר.

## צרו קשר

אנו מזמינים אתכם לבקר אותנו או ליצור קשר לקבלת ייעוץ מקצועי.

**טלפון:** 050-1234567  
**אימייל:** info@strongluxurycars.com  
**כתובת:** תל אביב, ישראל
        `,
        template: 'about',
        category: 'company',
        tags: ['אודות', 'חברה', 'יוקרה']
      },
      {
        slug: 'terms',
        title: 'תנאי שימוש',
        content: `
# תנאי שימוש

## 1. קבלת התנאים

בגישה לאתר Strong Luxury Cars ובשימוש בשירותים שלנו, אתם מסכימים לתנאי שימוש אלה.

## 2. שימוש באתר

- האתר מיועד לשימוש אישי ולא מסחרי
- אסור להשתמש באתר למטרות בלתי חוקיות
- אסור לפגוע בפעילות האתר או לנסות לגשת למערכות האבטחה

## 3. תוכן האתר

- כל התוכן באתר הוא בבעלות Strong Luxury Cars
- אסור להעתיק, להפיץ או לשנות תוכן ללא אישור
- התמונות והמידע מוגנים בזכויות יוצרים

## 4. רכישת רכבים

- המחירים באתר אינם מחייבים ועשויים להשתנות
- הרכישה כפופה לאישור מלאי
- תנאי התשלום והמימון יקבעו בעת הרכישה

## 5. אחריות

- אנו מתחייבים לספק מידע מדויק ככל האפשר
- לא נוכל להיות אחראים לנזקים עקיפים
- האחריות על הרכב נקבעת לפי תנאי היצרן

## 6. פרטיות

- אנו מכבדים את פרטיותכם
- המידע שנאסוף ישמש רק למטרות שירות
- לא נמכור או נשתף מידע עם צדדים שלישיים

## 7. שינויים בתנאים

אנו שומרים לעצמנו את הזכות לשנות תנאים אלה בכל עת.

## 8. יצירת קשר

לשאלות בנוגע לתנאי שימוש, צרו קשר:
**אימייל:** legal@strongluxurycars.com
        `,
        template: 'terms',
        category: 'legal',
        tags: ['תנאים', 'חוקי', 'שימוש']
      },
      {
        slug: 'privacy',
        title: 'מדיניות פרטיות',
        content: `
# מדיניות פרטיות

## 1. איסוף מידע

אנו אוספים מידע הבא:
- **מידע אישי:** שם, טלפון, אימייל
- **מידע טכני:** כתובת IP, סוג דפדפן, מערכת הפעלה
- **מידע שימוש:** דפים שנצפו, זמן שהייה, קליקים

## 2. שימוש במידע

המידע שנאסוף משמש ל:
- מתן שירות לקוחות
- שיפור האתר והשירותים
- שליחת עדכונים ומידע שיווקי (בהסכמה)
- אבטחה ומניעת הונאות

## 3. שמירת מידע

- המידע נשמר במסדי נתונים מאובטחים
- אנו נוקטים באמצעי אבטחה מתקדמים
- המידע נשמר כל עוד נדרש לשירות

## 4. שיתוף מידע

אנו לא מוכרים או משתפים מידע אישי עם צדדים שלישיים, למעט:
- ספקי שירות נאמנים (אירוח, אבטחה)
- דרישות חוקיות
- הגנה על זכויותינו

## 5. זכויותיכם

לכם הזכות:
- לגשת למידע האישי שלכם
- לתקן מידע לא מדויק
- למחוק את המידע שלכם
- להתנגד לעיבוד המידע
- לבקש העברת המידע

## 6. עוגיות (Cookies)

אנו משתמשים בעוגיות ל:
- שמירת העדפות משתמש
- ניתוח שימוש באתר
- שיפור חוויית המשתמש

## 7. אבטחה

אנו נוקטים באמצעי אבטחה מתקדמים:
- הצפנת SSL
- גיבוי מאובטח
- בקרת גישה קפדנית
- ניטור אבטחה מתמיד

## 8. שינויים במדיניות

אנו עשויים לעדכן מדיניות זו מעת לעת.

## 9. יצירת קשר

לשאלות בנוגע לפרטיות:
**אימייל:** privacy@strongluxurycars.com  
**טלפון:** 050-1234567
        `,
        template: 'privacy',
        category: 'legal',
        tags: ['פרטיות', 'אבטחה', 'מידע']
      },
      {
        slug: 'contact',
        title: 'צור קשר',
        content: `
# צור קשר

## פרטי התקשרות

**טלפון:** 050-1234567  
**אימייל:** info@strongluxurycars.com  
**כתובת:** תל אביב, ישראל

## שעות פעילות

**ראשון - חמישי:** 09:00 - 19:00  
**שישי:** 09:00 - 14:00  
**שבת:** סגור

## מיקום

המשרד שלנו ממוקם במרכז תל אביב, עם חניה חופשית ונגישות נוחה.

## צוות המכירות

**יוסי כהן** - מנהל מכירות  
טלפון: 050-1234568  
אימייל: yossi@strongluxurycars.com

**שרה לוי** - יועצת מכירות  
טלפון: 050-1234569  
אימייל: sara@strongluxurycars.com

## שירות לקוחות

**דן אברהם** - מנהל שירות לקוחות  
טלפון: 050-1234570  
אימייל: dan@strongluxurycars.com

## תמיכה טכנית

**מיכאל דוד** - מנהל טכני  
טלפון: 050-1234571  
אימייל: michael@strongluxurycars.com

## טופס יצירת קשר

אתם מוזמנים למלא את הטופס באתר או ליצור קשר ישירות.

## רשתות חברתיות

**פייסבוק:** Strong Luxury Cars  
**אינסטגרם:** @strongluxurycars  
**לינקדאין:** Strong Luxury Cars
        `,
        template: 'contact',
        category: 'company',
        tags: ['צור קשר', 'מידע', 'שירות']
      }
    ];

    for (const pageData of defaultPages) {
      try {
        await this.createStaticPage({
          ...pageData,
          isPublished: true,
          isPublic: true,
          language: 'he'
        });
      } catch (error) {
        console.error(`שגיאה ביצירת דף ${pageData.slug}:`, error);
      }
    }
  }

  // יצירת slug
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[א-ת]/g, (char) => {
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

  // יצירת meta description
  private generateMetaDescription(content: string): string {
    // הסרת HTML tags
    const textContent = content.replace(/<[^>]*>/g, '');
    // הסרת markdown
    const cleanContent = textContent.replace(/[#*`]/g, '');
    // קיצור ל-160 תווים
    return cleanContent.length > 160 
      ? cleanContent.substring(0, 157) + '...'
      : cleanContent;
  }

  // חילוץ מילות מפתח
  private extractKeywords(content: string): string[] {
    const words = content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*`]/g, '')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['את', 'על', 'אל', 'עם', 'של', 'בל', 'כל', 'הם', 'הן', 'אני', 'אתה', 'היא', 'אנחנו', 'אתם', 'הן'].includes(word));

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // זיהוי שינויים
  private detectChanges(oldPage: StaticPage, updates: Partial<StaticPage>): string[] {
    const changes: string[] = [];

    if (updates.title && updates.title !== oldPage.title) {
      changes.push('עדכון כותרת');
    }
    if (updates.content && updates.content !== oldPage.content) {
      changes.push('עדכון תוכן');
    }
    if (updates.metaTitle && updates.metaTitle !== oldPage.metaTitle) {
      changes.push('עדכון meta title');
    }
    if (updates.metaDescription && updates.metaDescription !== oldPage.metaDescription) {
      changes.push('עדכון meta description');
    }
    if (updates.isPublished !== undefined && updates.isPublished !== oldPage.isPublished) {
      changes.push(updates.isPublished ? 'פרסום דף' : 'ביטול פרסום');
    }

    return changes.length > 0 ? changes : ['עדכון כללי'];
  }

  // עדכון SEO לדף
  private async updateSEOForPage(page: StaticPage): Promise<void> {
    try {
      const seoData = {
        title: page.metaTitle || page.title,
        description: page.metaDescription || this.generateMetaDescription(page.content),
        keywords: page.metaKeywords || this.extractKeywords(page.content),
        url: `/${page.slug}`,
        language: page.language
      };

      // עדכון Meta tags
      seoUtils.updateMeta(seoData);

      // הוספת Schema markup
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.metaDescription,
        url: seoData.url,
        inLanguage: page.language,
        dateModified: page.lastModified.toISOString(),
        datePublished: page.createdAt.toISOString(),
        publisher: {
          '@type': 'Organization',
          name: 'Strong Luxury Cars',
          url: 'https://strongluxurycars.com'
        }
      };

      seoOptimizer.addSchemaMarkup(schema);
    } catch (error) {
      console.error('שגיאה בעדכון SEO לדף:', error);
    }
  }
}

// יצירת instance גלובלי
export const staticPageManager = new StaticPageManager();

// פונקציות עזר
export const staticPageUtils = {
  // יצירת דף סטטי
  createPage: (page: Partial<StaticPage>) => staticPageManager.createStaticPage(page),

  // עדכון דף סטטי
  updatePage: (id: string, updates: Partial<StaticPage>) => staticPageManager.updateStaticPage(id, updates),

  // מחיקת דף סטטי
  deletePage: (id: string) => staticPageManager.deleteStaticPage(id),

  // קבלת דף לפי slug
  getPageBySlug: (slug: string, language?: string) => staticPageManager.getStaticPageBySlug(slug, language),

  // קבלת דף לפי ID
  getPageById: (id: string) => staticPageManager.getStaticPageById(id),

  // קבלת דפים
  getPages: (filter?: StaticPageFilter) => staticPageManager.getStaticPages(filter),

  // יצירת תבנית
  createTemplate: (template: Partial<PageTemplate>) => staticPageManager.createPageTemplate(template),

  // קבלת תבניות
  getTemplates: () => staticPageManager.getPageTemplates(),

  // יצירת דפים ברירת מחדל
  createDefaultPages: () => staticPageManager.createDefaultPages(),

  // קבלת revisions
  getRevisions: (pageId: string) => staticPageManager.getPageRevisions(pageId),

  // שחזור revision
  restoreRevision: (pageId: string, version: number) => staticPageManager.restoreRevision(pageId, version)
};

// Hook ל-React לניהול דפים סטטיים
export const useStaticPages = () => {
  return {
    createPage: staticPageUtils.createPage,
    updatePage: staticPageUtils.updatePage,
    deletePage: staticPageUtils.deletePage,
    getPageBySlug: staticPageUtils.getPageBySlug,
    getPageById: staticPageUtils.getPageById,
    getPages: staticPageUtils.getPages,
    createTemplate: staticPageUtils.createTemplate,
    getTemplates: staticPageUtils.getTemplates,
    createDefaultPages: staticPageUtils.createDefaultPages,
    getRevisions: staticPageUtils.getRevisions,
    restoreRevision: staticPageUtils.restoreRevision
  };
};

export default StaticPageManager;
