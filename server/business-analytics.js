const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Business Analytics Functions

/**
 * Get sales analytics for a specific period
 */
const getSalesAnalytics = async (startDate, endDate) => {
  try {
    const { data: sales, error } = await supabase
      .from('cars')
      .select('*')
      .eq('status', 'sold')
      .gte('updated_at', startDate)
      .lte('updated_at', endDate);

    if (error) throw error;

    const analytics = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, car) => sum + car.price, 0),
      averagePrice: sales.length > 0 ? sales.reduce((sum, car) => sum + car.price, 0) / sales.length : 0,
      topBrands: {},
      topModels: {},
      monthlyBreakdown: {},
      priceRange: {
        under100k: 0,
        between100k200k: 0,
        between200k300k: 0,
        over300k: 0
      }
    };

    // Analyze brands and models
    sales.forEach(car => {
      // Top brands
      analytics.topBrands[car.brand] = (analytics.topBrands[car.brand] || 0) + 1;
      
      // Top models
      const modelKey = `${car.brand} ${car.model}`;
      analytics.topModels[modelKey] = (analytics.topModels[modelKey] || 0) + 1;
      
      // Monthly breakdown
      const month = new Date(car.updated_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
      analytics.monthlyBreakdown[month] = (analytics.monthlyBreakdown[month] || 0) + 1;
      
      // Price range analysis
      if (car.price < 100000) {
        analytics.priceRange.under100k++;
      } else if (car.price < 200000) {
        analytics.priceRange.between100k200k++;
      } else if (car.price < 300000) {
        analytics.priceRange.between200k300k++;
      } else {
        analytics.priceRange.over300k++;
      }
    });

    // Sort top brands and models
    analytics.topBrands = Object.entries(analytics.topBrands)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    analytics.topModels = Object.entries(analytics.topModels)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    return analytics;
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};

/**
 * Get leads analytics
 */
const getLeadsAnalytics = async (startDate, endDate) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const analytics = {
      totalLeads: leads.length,
      byStatus: {},
      bySource: {},
      byPriority: {},
      conversionRate: 0,
      averageResponseTime: 0,
      topInterestedCars: {},
      monthlyTrend: {}
    };

    // Analyze leads
    leads.forEach(lead => {
      // Status breakdown
      analytics.byStatus[lead.status] = (analytics.byStatus[lead.status] || 0) + 1;
      
      // Source breakdown
      analytics.bySource[lead.source] = (analytics.bySource[lead.source] || 0) + 1;
      
      // Priority breakdown
      if (lead.priority) {
        analytics.byPriority[lead.priority] = (analytics.byPriority[lead.priority] || 0) + 1;
      }
      
      // Monthly trend
      const month = new Date(lead.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
      analytics.monthlyTrend[month] = (analytics.monthlyTrend[month] || 0) + 1;
      
      // Interested cars
      if (lead.interest_in_car) {
        analytics.topInterestedCars[lead.interest_in_car] = (analytics.topInterestedCars[lead.interest_in_car] || 0) + 1;
      }
    });

    // Calculate conversion rate (closed leads / total leads)
    const closedLeads = analytics.byStatus.closed || 0;
    analytics.conversionRate = leads.length > 0 ? (closedLeads / leads.length) * 100 : 0;

    return analytics;
  } catch (error) {
    console.error('Error getting leads analytics:', error);
    throw error;
  }
};

/**
 * Get inventory analytics
 */
const getInventoryAnalytics = async () => {
  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const analytics = {
      totalCars: cars.length,
      byStatus: {},
      byBrand: {},
      byCategory: {},
      byCondition: {},
      byTransmission: {},
      byFuelType: {},
      averageAge: 0,
      totalValue: 0,
      priceDistribution: {
        under100k: 0,
        between100k200k: 0,
        between200k300k: 0,
        over300k: 0
      },
      mileageDistribution: {
        under50k: 0,
        between50k100k: 0,
        between100k150k: 0,
        over150k: 0
      }
    };

    let totalAge = 0;
    let totalValue = 0;

    cars.forEach(car => {
      // Status breakdown
      analytics.byStatus[car.status] = (analytics.byStatus[car.status] || 0) + 1;
      
      // Brand breakdown
      analytics.byBrand[car.brand] = (analytics.byBrand[car.brand] || 0) + 1;
      
      // Category breakdown
      analytics.byCategory[car.category] = (analytics.byCategory[car.category] || 0) + 1;
      
      // Condition breakdown
      analytics.byCondition[car.condition] = (analytics.byCondition[car.condition] || 0) + 1;
      
      // Transmission breakdown
      analytics.byTransmission[car.transmission] = (analytics.byTransmission[car.transmission] || 0) + 1;
      
      // Fuel type breakdown
      analytics.byFuelType[car.fuelType] = (analytics.byFuelType[car.fuelType] || 0) + 1;
      
      // Age calculation
      const currentYear = new Date().getFullYear();
      const carAge = currentYear - car.year;
      totalAge += carAge;
      
      // Total value
      totalValue += car.price;
      
      // Price distribution
      if (car.price < 100000) {
        analytics.priceDistribution.under100k++;
      } else if (car.price < 200000) {
        analytics.priceDistribution.between100k200k++;
      } else if (car.price < 300000) {
        analytics.priceDistribution.between200k300k++;
      } else {
        analytics.priceDistribution.over300k++;
      }
      
      // Mileage distribution
      if (car.kilometers < 50000) {
        analytics.mileageDistribution.under50k++;
      } else if (car.kilometers < 100000) {
        analytics.mileageDistribution.between50k100k++;
      } else if (car.kilometers < 150000) {
        analytics.mileageDistribution.between100k150k++;
      } else {
        analytics.mileageDistribution.over150k++;
      }
    });

    analytics.averageAge = cars.length > 0 ? totalAge / cars.length : 0;
    analytics.totalValue = totalValue;

    return analytics;
  } catch (error) {
    console.error('Error getting inventory analytics:', error);
    throw error;
  }
};

/**
 * Get performance analytics
 */
const getPerformanceAnalytics = async (startDate, endDate) => {
  try {
    const [salesAnalytics, leadsAnalytics, inventoryAnalytics] = await Promise.all([
      getSalesAnalytics(startDate, endDate),
      getLeadsAnalytics(startDate, endDate),
      getInventoryAnalytics()
    ]);

    const performance = {
      sales: salesAnalytics,
      leads: leadsAnalytics,
      inventory: inventoryAnalytics,
      kpis: {
        salesGrowth: 0, // Would need historical data to calculate
        leadConversionRate: leadsAnalytics.conversionRate,
        averageSalePrice: salesAnalytics.averagePrice,
        inventoryTurnover: 0, // Would need historical data to calculate
        totalRevenue: salesAnalytics.totalRevenue,
        totalLeads: leadsAnalytics.totalLeads,
        totalSales: salesAnalytics.totalSales
      },
      recommendations: []
    };

    // Generate recommendations based on analytics
    if (leadsAnalytics.conversionRate < 10) {
      performance.recommendations.push({
        type: 'conversion',
        priority: 'high',
        message: 'שיעור המרת לידים נמוך. מומלץ לשפר את תהליך המעקב והמכירה.',
        action: 'סקור את תהליך המעקב אחר לידים ושיפור התקשורת עם לקוחות פוטנציאליים'
      });
    }

    if (salesAnalytics.averagePrice < 150000) {
      performance.recommendations.push({
        type: 'pricing',
        priority: 'medium',
        message: 'מחיר מכירה ממוצע נמוך. שקול להוסיף רכבי יוקרה נוספים.',
        action: 'הוסף רכבי יוקרה בעלי ערך גבוה יותר למלאי'
      });
    }

    if (inventoryAnalytics.byStatus.available > inventoryAnalytics.totalCars * 0.8) {
      performance.recommendations.push({
        type: 'inventory',
        priority: 'medium',
        message: 'יותר מ-80% מהמלאי זמין למכירה. שקול להגדיל את המאמצים השיווקיים.',
        action: 'הגבר את הפעילות השיווקית והפרסומית'
      });
    }

    return performance;
  } catch (error) {
    console.error('Error getting performance analytics:', error);
    throw error;
  }
};

/**
 * Get business insights for AI
 */
const getBusinessInsights = async (query, startDate, endDate) => {
  try {
    const analytics = await getPerformanceAnalytics(startDate, endDate);
    
    let insights = '';
    
    // Sales insights
    if (query.includes('מכירות') || query.includes('הכנסות')) {
      insights += `\nנתוני מכירות (${startDate} - ${endDate}):\n`;
      insights += `- סך מכירות: ${analytics.sales.totalSales}\n`;
      insights += `- סך הכנסות: ₪${analytics.sales.totalRevenue.toLocaleString()}\n`;
      insights += `- מחיר ממוצע: ₪${Math.round(analytics.sales.averagePrice).toLocaleString()}\n`;
      insights += `- מותגים מובילים: ${Object.keys(analytics.sales.topBrands).slice(0, 3).join(', ')}\n`;
    }
    
    // Leads insights
    if (query.includes('לידים') || query.includes('לקוחות')) {
      insights += `\nנתוני לידים (${startDate} - ${endDate}):\n`;
      insights += `- סך לידים: ${analytics.leads.totalLeads}\n`;
      insights += `- שיעור המרה: ${analytics.leads.conversionRate.toFixed(1)}%\n`;
      insights += `- מקורות עיקריים: ${Object.keys(analytics.leads.bySource).slice(0, 3).join(', ')}\n`;
    }
    
    // Inventory insights
    if (query.includes('מלאי') || query.includes('רכבים')) {
      insights += `\nנתוני מלאי:\n`;
      insights += `- סך רכבים: ${analytics.inventory.totalCars}\n`;
      insights += `- ערך כולל: ₪${analytics.inventory.totalValue.toLocaleString()}\n`;
      insights += `- גיל ממוצע: ${analytics.inventory.averageAge.toFixed(1)} שנים\n`;
      insights += `- מותגים במלאי: ${Object.keys(analytics.inventory.byBrand).slice(0, 5).join(', ')}\n`;
    }
    
    // Recommendations
    if (analytics.recommendations.length > 0) {
      insights += `\nהמלצות עסקיות:\n`;
      analytics.recommendations.forEach((rec, index) => {
        insights += `${index + 1}. ${rec.message}\n`;
        insights += `   פעולה מומלצת: ${rec.action}\n`;
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Error getting business insights:', error);
    return 'שגיאה בקבלת נתונים עסקיים. אנא נסה שוב מאוחר יותר.';
  }
};

module.exports = {
  getSalesAnalytics,
  getLeadsAnalytics,
  getInventoryAnalytics,
  getPerformanceAnalytics,
  getBusinessInsights
};
