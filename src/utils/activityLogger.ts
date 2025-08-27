import { supabase } from './supabase';
import { User } from '../types';

export type ActivityType = 
  // פעולות משתמש
  | 'user.login'
  | 'user.logout'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password_change'
  | 'user.2fa_enable'
  | 'user.2fa_disable'
  
  // פעולות רכבים
  | 'car.create'
  | 'car.update'
  | 'car.delete'
  | 'car.activate'
  | 'car.deactivate'
  | 'car.view'
  
  // פעולות מדיה
  | 'media.upload'
  | 'media.delete'
  | 'media.view'
  
  // פעולות לידים
  | 'lead.create'
  | 'lead.update'
  | 'lead.delete'
  | 'lead.assign'
  | 'lead.status_change'
  | 'lead.view'
  
  // פעולות WhatsApp
  | 'whatsapp.message_sent'
  | 'whatsapp.message_received'
  | 'whatsapp.template_created'
  | 'whatsapp.template_updated'
  | 'whatsapp.template_deleted'
  | 'whatsapp.session_connected'
  | 'whatsapp.session_disconnected'
  
  // פעולות מערכת
  | 'system.error'
  | 'system.warning'
  | 'system.info'
  | 'system.maintenance'
  
  // פעולות אבטחה
  | 'security.login_attempt'
  | 'security.login_failed'
  | 'security.permission_denied'
  | 'security.suspicious_activity'
  
  // פעולות דוחות
  | 'report.generated'
  | 'report.exported'
  | 'report.viewed';

export type ActivitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ActivityLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  type: ActivityType;
  severity: ActivitySeverity;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceId?: string;
  resourceType?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ActivityFilter {
  userId?: string;
  type?: ActivityType;
  severity?: ActivitySeverity;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// קבלת IP address של המשתמש
export const getClientIP = (): string => {
  // בפועל זה יגיע מה-server headers
  return '127.0.0.1';
};

// קבלת User Agent של המשתמש
export const getClientUserAgent = (): string => {
  return navigator.userAgent;
};

// קבלת Session ID
export const getSessionId = (): string => {
  return sessionStorage.getItem('sessionId') || 'unknown';
};

// יצירת לוג פעילות
export const logActivity = async (
  type: ActivityType,
  description: string,
  options: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    severity?: ActivitySeverity;
    details?: Record<string, any>;
    resourceId?: string;
    resourceType?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> => {
  try {
    const {
      userId,
      userEmail,
      userRole,
      severity = 'medium',
      details,
      resourceId,
      resourceType,
      oldValues,
      newValues,
      metadata
    } = options;

    const activityLog = {
      user_id: userId,
      user_email: userEmail,
      user_role: userRole,
      type,
      severity,
      description,
      details: details ? JSON.stringify(details) : null,
      ip_address: getClientIP(),
      user_agent: getClientUserAgent(),
      session_id: getSessionId(),
      resource_id: resourceId,
      resource_type: resourceType,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      metadata: metadata ? JSON.stringify(metadata) : null
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert([activityLog]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error in logActivity:', error);
  }
};

// לוג התחברות משתמש
export const logUserLogin = async (user: User, success: boolean, details?: Record<string, any>): Promise<void> => {
  const type: ActivityType = success ? 'user.login' : 'security.login_failed';
  const severity: ActivitySeverity = success ? 'low' : 'high';
  const description = success 
    ? `משתמש ${user.username} התחבר בהצלחה`
    : `ניסיון התחברות כושל עבור ${user.username}`;

  await logActivity(type, description, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity,
    details,
    metadata: { success }
  });
};

// לוג יציאה משתמש
export const logUserLogout = async (user: User): Promise<void> => {
  await logActivity('user.logout', `משתמש ${user.username} התנתק`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'low'
  });
};

// לוג יצירת רכב
export const logCarCreated = async (user: User, carId: string, carName: string): Promise<void> => {
  await logActivity('car.create', `רכב חדש נוצר: ${carName}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'medium',
    resourceId: carId,
    resourceType: 'car',
    newValues: { name: carName }
  });
};

// לוג עדכון רכב
export const logCarUpdated = async (
  user: User, 
  carId: string, 
  carName: string, 
  oldValues: Record<string, any>, 
  newValues: Record<string, any>
): Promise<void> => {
  await logActivity('car.update', `רכב עודכן: ${carName}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'medium',
    resourceId: carId,
    resourceType: 'car',
    oldValues,
    newValues
  });
};

// לוג מחיקת רכב
export const logCarDeleted = async (user: User, carId: string, carName: string): Promise<void> => {
  await logActivity('car.delete', `רכב נמחק: ${carName}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'high',
    resourceId: carId,
    resourceType: 'car',
    oldValues: { name: carName }
  });
};

// לוג יצירת ליד
export const logLeadCreated = async (user: User, leadId: string, leadName: string): Promise<void> => {
  await logActivity('lead.create', `ליד חדש נוצר: ${leadName}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'medium',
    resourceId: leadId,
    resourceType: 'lead',
    newValues: { name: leadName }
  });
};

// לוג עדכון סטטוס ליד
export const logLeadStatusChange = async (
  user: User, 
  leadId: string, 
  leadName: string, 
  oldStatus: string, 
  newStatus: string
): Promise<void> => {
  await logActivity('lead.status_change', `סטטוס ליד השתנה: ${leadName}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'medium',
    resourceId: leadId,
    resourceType: 'lead',
    oldValues: { status: oldStatus },
    newValues: { status: newStatus }
  });
};

// לוג שליחת הודעת WhatsApp
export const logWhatsAppMessageSent = async (
  user: User, 
  recipient: string, 
  messageType: string,
  templateId?: string
): Promise<void> => {
  await logActivity('whatsapp.message_sent', `הודעת WhatsApp נשלחה ל: ${recipient}`, {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    severity: 'low',
    details: { recipient, messageType, templateId }
  });
};

// לוג שגיאת מערכת
export const logSystemError = async (
  error: Error, 
  context: string, 
  user?: User
): Promise<void> => {
  await logActivity('system.error', `שגיאת מערכת: ${error.message}`, {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    severity: 'critical',
    details: { 
      error: error.message, 
      stack: error.stack, 
      context 
    }
  });
};

// לוג פעילות חשודה
export const logSuspiciousActivity = async (
  activity: string, 
  details: Record<string, any>, 
  user?: User
): Promise<void> => {
  await logActivity('security.suspicious_activity', `פעילות חשודה: ${activity}`, {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    severity: 'high',
    details
  });
};

// קבלת לוגי פעילות
export const getActivityLogs = async (filter: ActivityFilter = {}): Promise<ActivityLog[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // החלת פילטרים
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    
    if (filter.type) {
      query = query.eq('type', filter.type);
    }
    
    if (filter.severity) {
      query = query.eq('severity', filter.severity);
    }
    
    if (filter.resourceType) {
      query = query.eq('resource_type', filter.resourceType);
    }
    
    if (filter.resourceId) {
      query = query.eq('resource_id', filter.resourceId);
    }
    
    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate.toISOString());
    }
    
    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate.toISOString());
    }

    // הגבלת תוצאות
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    
    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user_email,
      userRole: log.user_role,
      type: log.type,
      severity: log.severity,
      description: log.description,
      details: log.details ? JSON.parse(log.details) : undefined,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      sessionId: log.session_id,
      resourceId: log.resource_id,
      resourceType: log.resource_type,
      oldValues: log.old_values ? JSON.parse(log.old_values) : undefined,
      newValues: log.new_values ? JSON.parse(log.new_values) : undefined,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
      createdAt: new Date(log.created_at)
    }));
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return [];
  }
};

// קבלת סטטיסטיקות פעילות
export const getActivityStats = async (userId?: string, days: number = 30): Promise<{
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activitiesBySeverity: Record<string, number>;
  recentActivities: ActivityLog[];
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await getActivityLogs({
      userId,
      startDate,
      limit: 1000
    });

    const activitiesByType: Record<string, number> = {};
    const activitiesBySeverity: Record<string, number> = {};

    logs.forEach(log => {
      activitiesByType[log.type] = (activitiesByType[log.type] || 0) + 1;
      activitiesBySeverity[log.severity] = (activitiesBySeverity[log.severity] || 0) + 1;
    });

    return {
      totalActivities: logs.length,
      activitiesByType,
      activitiesBySeverity,
      recentActivities: logs.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return {
      totalActivities: 0,
      activitiesByType: {},
      activitiesBySeverity: {},
      recentActivities: []
    };
  }
};

// מחיקת לוגים ישנים
export const cleanupOldLogs = async (daysToKeep: number = 90): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
    return 0;
  }
};

// יצירת דוח פעילות
export const generateActivityReport = async (
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<{
  summary: {
    totalActivities: number;
    uniqueUsers: number;
    activitiesByType: Record<string, number>;
    activitiesBySeverity: Record<string, number>;
  };
  activities: ActivityLog[];
}> => {
  try {
    const logs = await getActivityLogs({
      userId,
      startDate,
      endDate,
      limit: 10000
    });

    const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean)).size;
    const activitiesByType: Record<string, number> = {};
    const activitiesBySeverity: Record<string, number> = {};

    logs.forEach(log => {
      activitiesByType[log.type] = (activitiesByType[log.type] || 0) + 1;
      activitiesBySeverity[log.severity] = (activitiesBySeverity[log.severity] || 0) + 1;
    });

    return {
      summary: {
        totalActivities: logs.length,
        uniqueUsers,
        activitiesByType,
        activitiesBySeverity
      },
      activities: logs
    };
  } catch (error) {
    console.error('Error generating activity report:', error);
    return {
      summary: {
        totalActivities: 0,
        uniqueUsers: 0,
        activitiesByType: {},
        activitiesBySeverity: {}
      },
      activities: []
    };
  }
};

// Middleware ללוג פעילות אוטומטי
export const withActivityLogging = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  activityType: ActivityType,
  description: string,
  options: {
    severity?: ActivitySeverity;
    user?: User;
    resourceId?: string;
    resourceType?: string;
  } = {}
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      
      // לוג הצלחה
      await logActivity(activityType, `${description} - הצלחה`, {
        ...options,
        details: {
          executionTime: Date.now() - startTime,
          success: true
        }
      });
      
      return result;
    } catch (error) {
      // לוג שגיאה
      await logActivity('system.error', `${description} - שגיאה: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        ...options,
        severity: 'high',
        details: {
          executionTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      throw error;
    }
  };
};
