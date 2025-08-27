// מערכת אינטגרציה עם Google Analytics 4
// מעקב אחר פעילות משתמשים, מכירות, והתנהגות באתר

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_brand: string;
  price: number;
  quantity?: number;
  currency?: string;
}

export interface EcommerceEvent {
  event_type: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'refund';
  items: EcommerceItem[];
  value?: number;
  currency?: string;
  transaction_id?: string;
}

export interface UserProperty {
  name: string;
  value: string | number | boolean;
}

export interface ConversionEvent {
  event_name: string;
  parameters: Record<string, any>;
}

class AnalyticsManager {
  private measurementId: string;
  private isInitialized: boolean = false;
  private debugMode: boolean = false;

  constructor(measurementId?: string) {
    this.measurementId = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID || '';
    this.debugMode = import.meta.env.NODE_ENV === 'development';
  }

  // אתחול Google Analytics
  async initialize(): Promise<void> {
    if (this.isInitialized || !this.measurementId) {
      return;
    }

    try {
      // טעינת Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // הגדרת dataLayer ו-gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // אתחול GA4
      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true
      });

      this.isInitialized = true;
      
      if (this.debugMode) {
        console.log('Google Analytics initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  // מעקב אחר דפים
  trackPageView(pageTitle?: string, pagePath?: string): void {
    if (!this.isInitialized) return;

    const title = pageTitle || document.title;
    const path = pagePath || window.location.pathname;

    window.gtag('config', this.measurementId, {
      page_title: title,
      page_location: `${window.location.origin}${path}`,
      send_page_view: true
    });

    if (this.debugMode) {
      console.log('Page view tracked:', { title, path });
    }
  }

  // מעקב אחר אירועים מותאמים אישית
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized) return;

    const parameters: Record<string, any> = {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    };

    window.gtag('event', event.action, parameters);

    if (this.debugMode) {
      console.log('Custom event tracked:', event);
    }
  }

  // מעקב אחר אירועי מסחר אלקטרוני
  trackEcommerceEvent(ecommerceEvent: EcommerceEvent): void {
    if (!this.isInitialized) return;

    const parameters: Record<string, any> = {
      currency: ecommerceEvent.currency || 'ILS',
      value: ecommerceEvent.value,
      transaction_id: ecommerceEvent.transaction_id,
      items: ecommerceEvent.items.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        item_category: item.item_category,
        item_brand: item.item_brand,
        price: item.price,
        quantity: item.quantity || 1,
        currency: item.currency || 'ILS'
      }))
    };

    window.gtag('event', ecommerceEvent.event_type, parameters);

    if (this.debugMode) {
      console.log('Ecommerce event tracked:', ecommerceEvent);
    }
  }

  // הגדרת מאפיינים של משתמש
  setUserProperties(properties: UserProperty[]): void {
    if (!this.isInitialized) return;

    properties.forEach(property => {
      window.gtag('config', this.measurementId, {
        [property.name]: property.value
      });
    });

    if (this.debugMode) {
      console.log('User properties set:', properties);
    }
  }

  // מעקב אחר המרות
  trackConversion(event: ConversionEvent): void {
    if (!this.isInitialized) return;

    window.gtag('event', event.event_name, event.parameters);

    if (this.debugMode) {
      console.log('Conversion tracked:', event);
    }
  }

  // מעקב אחר חיפושים
  trackSearch(searchTerm: string, resultsCount?: number): void {
    this.trackEvent({
      action: 'search',
      category: 'engagement',
      label: searchTerm,
      value: resultsCount,
      custom_parameters: {
        search_term: searchTerm,
        results_count: resultsCount
      }
    });
  }

  // מעקב אחר צפייה ברכב
  trackCarView(carId: string, carName: string, carBrand: string, price: number): void {
    this.trackEcommerceEvent({
      event_type: 'view_item',
      items: [{
        item_id: carId,
        item_name: carName,
        item_category: 'Cars',
        item_brand: carBrand,
        price: price,
        currency: 'ILS'
      }]
    });
  }

  // מעקב אחר יצירת קשר
  trackContact(carId?: string, contactMethod: 'whatsapp' | 'phone' | 'form' = 'form'): void {
    this.trackEvent({
      action: 'contact',
      category: 'engagement',
      label: contactMethod,
      custom_parameters: {
        car_id: carId,
        contact_method: contactMethod
      }
    });
  }

  // מעקב אחר הורדת קטלוג
  trackCatalogDownload(carId?: string): void {
    this.trackEvent({
      action: 'download_catalog',
      category: 'engagement',
      label: carId || 'general',
      custom_parameters: {
        car_id: carId
      }
    });
  }

  // מעקב אחר שימוש במחשבון מימון
  trackFinanceCalculator(carId?: string, loanAmount?: number): void {
    this.trackEvent({
      action: 'use_finance_calculator',
      category: 'engagement',
      label: carId || 'general',
      value: loanAmount,
      custom_parameters: {
        car_id: carId,
        loan_amount: loanAmount
      }
    });
  }

  // מעקב אחר השוואת רכבים
  trackCarComparison(carIds: string[]): void {
    this.trackEvent({
      action: 'compare_cars',
      category: 'engagement',
      label: carIds.join(','),
      value: carIds.length,
      custom_parameters: {
        car_ids: carIds,
        comparison_count: carIds.length
      }
    });
  }

  // מעקב אחר לידים
  trackLead(carId?: string, leadSource: 'website' | 'whatsapp' | 'phone' | 'form' = 'website'): void {
    this.trackEvent({
      action: 'generate_lead',
      category: 'conversion',
      label: leadSource,
      custom_parameters: {
        car_id: carId,
        lead_source: leadSource
      }
    });
  }

  // מעקב אחר שגיאות
  trackError(errorType: string, errorMessage: string, carId?: string): void {
    this.trackEvent({
      action: 'error',
      category: 'system',
      label: errorType,
      custom_parameters: {
        error_message: errorMessage,
        car_id: carId
      }
    });
  }

  // מעקב אחר ביצועים
  trackPerformance(metric: string, value: number): void {
    this.trackEvent({
      action: 'performance',
      category: 'system',
      label: metric,
      value: value,
      custom_parameters: {
        metric_name: metric,
        metric_value: value
      }
    });
  }

  // קבלת נתונים מ-GA4
  async getAnalyticsData(startDate: string, endDate: string, metrics: string[]): Promise<any> {
    // כאן תהיה אינטגרציה עם Google Analytics API
    // נדרש API key ו-service account
    console.log('Analytics data request:', { startDate, endDate, metrics });
    return null;
  }

  // יצירת דוחות
  generateReport(reportType: 'sales' | 'traffic' | 'conversions' | 'performance'): any {
    // יצירת דוחות מותאמים אישית
    const report = {
      type: reportType,
      generated_at: new Date().toISOString(),
      data: {}
    };

    if (this.debugMode) {
      console.log('Report generated:', report);
    }

    return report;
  }

  // ניקוי נתונים
  clearData(): void {
    if (this.isInitialized) {
      window.gtag('config', this.measurementId, {
        custom_map: {}
      });
    }
  }

  // בדיקת סטטוס
  getStatus(): { initialized: boolean; measurementId: string; debugMode: boolean } {
    return {
      initialized: this.isInitialized,
      measurementId: this.measurementId,
      debugMode: this.debugMode
    };
  }
}

// יצירת instance גלובלי
export const analyticsManager = new AnalyticsManager();

// פונקציות עזר
export const analyticsUtils = {
  // אתחול מהיר
  init: () => analyticsManager.initialize(),
  
  // מעקב מהיר אחר דפים
  pageView: (title?: string, path?: string) => analyticsManager.trackPageView(title, path),
  
  // מעקב מהיר אחר אירועים
  event: (action: string, category: string, label?: string, value?: number) => 
    analyticsManager.trackEvent({ action, category, label, value }),
  
  // מעקב מהיר אחר רכבים
  carView: (carId: string, carName: string, carBrand: string, price: number) =>
    analyticsManager.trackCarView(carId, carName, carBrand, price),
  
  // מעקב מהיר אחר יצירת קשר
  contact: (carId?: string, method: 'whatsapp' | 'phone' | 'form' = 'form') =>
    analyticsManager.trackContact(carId, method),
  
  // מעקב מהיר אחר לידים
  lead: (carId?: string, source: 'website' | 'whatsapp' | 'phone' | 'form' = 'website') =>
    analyticsManager.trackLead(carId, source),
  
  // בדיקת סטטוס
  status: () => analyticsManager.getStatus()
};

// React Hook לשימוש בקומפוננטות
export const useAnalytics = () => {
  const trackPageView = (title?: string, path?: string) => {
    analyticsManager.trackPageView(title, path);
  };

  const trackEvent = (event: AnalyticsEvent) => {
    analyticsManager.trackEvent(event);
  };

  const trackCarView = (carId: string, carName: string, carBrand: string, price: number) => {
    analyticsManager.trackCarView(carId, carName, carBrand, price);
  };

  const trackContact = (carId?: string, method: 'whatsapp' | 'phone' | 'form' = 'form') => {
    analyticsManager.trackContact(carId, method);
  };

  const trackLead = (carId?: string, source: 'website' | 'whatsapp' | 'phone' | 'form' = 'website') => {
    analyticsManager.trackLead(carId, source);
  };

  return {
    trackPageView,
    trackEvent,
    trackCarView,
    trackContact,
    trackLead,
    status: analyticsManager.getStatus()
  };
};

export default AnalyticsManager;
