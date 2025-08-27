// מערכת בדיקות אבטחה ו-GDPR compliance
// בדיקות אוטומטיות וניטור אבטחה

export interface SecurityVulnerability {
  id: string;
  type: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
  cvss?: number; // Common Vulnerability Scoring System
  location?: string;
  timestamp: Date;
}

export interface GDPRCompliance {
  dataRetention: boolean;
  dataEncryption: boolean;
  userConsent: boolean;
  dataPortability: boolean;
  rightToBeForgotten: boolean;
  privacyPolicy: boolean;
  cookieConsent: boolean;
  dataProcessing: boolean;
}

export interface SecurityAuditResult {
  vulnerabilities: SecurityVulnerability[];
  gdprCompliance: GDPRCompliance;
  overallScore: number;
  recommendations: string[];
  timestamp: Date;
}

class SecurityAuditor {
  private vulnerabilities: SecurityVulnerability[] = [];
  private auditHistory: SecurityAuditResult[] = [];

  // בדיקת XSS vulnerabilities
  checkXSSVulnerabilities(): SecurityVulnerability[] {
    const xssVulns: SecurityVulnerability[] = [];

    // בדיקת input validation
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const element = input as HTMLInputElement;
      if (!element.pattern && !element.required) {
        xssVulns.push({
          id: `xss-${Date.now()}`,
          type: 'medium',
          title: 'Missing Input Validation',
          description: `Input field ${element.name || element.id} lacks proper validation`,
          impact: 'Potential XSS attack vector',
          recommendation: 'Add proper input validation and sanitization',
          cwe: 'CWE-79',
          cvss: 6.1,
          location: element.outerHTML,
          timestamp: new Date()
        });
      }
    });

    return xssVulns;
  }

  // בדיקת CSRF vulnerabilities
  checkCSRFVulnerabilities(): SecurityVulnerability[] {
    const csrfVulns: SecurityVulnerability[] = [];

    // בדיקת CSRF tokens
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const csrfToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
      if (!csrfToken) {
        csrfVulns.push({
          id: `csrf-${Date.now()}`,
          type: 'high',
          title: 'Missing CSRF Protection',
          description: `Form ${form.id || 'unnamed'} lacks CSRF token`,
          impact: 'Potential CSRF attack',
          recommendation: 'Add CSRF tokens to all forms',
          cwe: 'CWE-352',
          cvss: 8.8,
          location: form.outerHTML,
          timestamp: new Date()
        });
      }
    });

    return csrfVulns;
  }

  // בדיקת Content Security Policy
  checkCSP(): SecurityVulnerability[] {
    const cspVulns: SecurityVulnerability[] = [];

    const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspHeader) {
      cspVulns.push({
        id: `csp-${Date.now()}`,
        type: 'medium',
        title: 'Missing Content Security Policy',
        description: 'No CSP header found',
        impact: 'Potential XSS and injection attacks',
        recommendation: 'Implement Content Security Policy',
        cwe: 'CWE-693',
        cvss: 5.3,
        timestamp: new Date()
      });
    }

    return cspVulns;
  }

  // בדיקת HTTPS
  checkHTTPS(): SecurityVulnerability[] {
    const httpsVulns: SecurityVulnerability[] = [];

    if (window.location.protocol !== 'https:') {
      httpsVulns.push({
        id: `https-${Date.now()}`,
        type: 'high',
        title: 'Not Using HTTPS',
        description: 'Application is not served over HTTPS',
        impact: 'Data transmitted in plain text',
        recommendation: 'Enable HTTPS for all communications',
        cwe: 'CWE-319',
        cvss: 7.5,
        timestamp: new Date()
      });
    }

    return httpsVulns;
  }

  // בדיקת sensitive data exposure
  checkSensitiveDataExposure(): SecurityVulnerability[] {
    const dataVulns: SecurityVulnerability[] = [];

    // בדיקת localStorage/sessionStorage
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        dataVulns.push({
          id: `data-${Date.now()}`,
          type: 'medium',
          title: 'Sensitive Data in localStorage',
          description: `Sensitive data found in localStorage: ${key}`,
          impact: 'Potential data exposure',
          recommendation: 'Use secure storage methods for sensitive data',
          cwe: 'CWE-200',
          cvss: 5.3,
          timestamp: new Date()
        });
      }
    }

    return dataVulns;
  }

  // בדיקת GDPR compliance
  checkGDPRCompliance(): GDPRCompliance {
    const compliance: GDPRCompliance = {
      dataRetention: this.checkDataRetention(),
      dataEncryption: this.checkDataEncryption(),
      userConsent: this.checkUserConsent(),
      dataPortability: this.checkDataPortability(),
      rightToBeForgotten: this.checkRightToBeForgotten(),
      privacyPolicy: this.checkPrivacyPolicy(),
      cookieConsent: this.checkCookieConsent(),
      dataProcessing: this.checkDataProcessing()
    };

    return compliance;
  }

  private checkDataRetention(): boolean {
    // בדיקה אם יש מדיניות שמירת נתונים
    const hasRetentionPolicy = document.querySelector('[data-retention-policy]') !== null;
    return hasRetentionPolicy;
  }

  private checkDataEncryption(): boolean {
    // בדיקה אם הנתונים מוצפנים
    const hasEncryption = window.location.protocol === 'https:' && 
                         document.querySelector('[data-encrypted]') !== null;
    return hasEncryption;
  }

  private checkUserConsent(): boolean {
    // בדיקה אם יש מנגנון הסכמה
    const hasConsent = document.querySelector('[data-consent]') !== null ||
                      localStorage.getItem('user-consent') !== null;
    return hasConsent;
  }

  private checkDataPortability(): boolean {
    // בדיקה אם יש אפשרות לייצוא נתונים
    const hasPortability = document.querySelector('[data-export]') !== null;
    return hasPortability;
  }

  private checkRightToBeForgotten(): boolean {
    // בדיקה אם יש אפשרות למחיקת נתונים
    const hasDeletion = document.querySelector('[data-delete-account]') !== null;
    return hasDeletion;
  }

  private checkPrivacyPolicy(): boolean {
    // בדיקה אם יש מדיניות פרטיות
    const hasPrivacyPolicy = document.querySelector('a[href*="privacy"], a[href*="policy"]') !== null;
    return hasPrivacyPolicy;
  }

  private checkCookieConsent(): boolean {
    // בדיקה אם יש הסכמה לעוגיות
    const hasCookieConsent = document.querySelector('[data-cookie-consent]') !== null ||
                            localStorage.getItem('cookie-consent') !== null;
    return hasCookieConsent;
  }

  private checkDataProcessing(): boolean {
    // בדיקה אם יש שקיפות בעיבוד נתונים
    const hasProcessingInfo = document.querySelector('[data-processing-info]') !== null;
    return hasProcessingInfo;
  }

  // בדיקת dependencies
  checkDependencies(): SecurityVulnerability[] {
    const depVulns: SecurityVulnerability[] = [];

    // בדיקת גרסאות ישנות של libraries
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('jquery') && !src.includes('3.')) {
        depVulns.push({
          id: `dep-${Date.now()}`,
          type: 'medium',
          title: 'Outdated jQuery Version',
          description: 'Using outdated jQuery version',
          impact: 'Potential security vulnerabilities',
          recommendation: 'Update to latest jQuery version',
          cwe: 'CWE-937',
          cvss: 5.3,
          location: src,
          timestamp: new Date()
        });
      }
    });

    return depVulns;
  }

  // בדיקת headers אבטחה
  checkSecurityHeaders(): SecurityVulnerability[] {
    const headerVulns: SecurityVulnerability[] = [];

    // בדיקת headers באמצעות fetch
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const headers = response.headers;
        
        if (!headers.get('X-Frame-Options')) {
          headerVulns.push({
            id: `header-${Date.now()}`,
            type: 'medium',
            title: 'Missing X-Frame-Options Header',
            description: 'No X-Frame-Options header found',
            impact: 'Potential clickjacking attack',
            recommendation: 'Add X-Frame-Options header',
            cwe: 'CWE-1021',
            cvss: 4.3,
            timestamp: new Date()
          });
        }

        if (!headers.get('X-Content-Type-Options')) {
          headerVulns.push({
            id: `header-${Date.now()}`,
            type: 'low',
            title: 'Missing X-Content-Type-Options Header',
            description: 'No X-Content-Type-Options header found',
            impact: 'Potential MIME type sniffing',
            recommendation: 'Add X-Content-Type-Options: nosniff',
            cwe: 'CWE-434',
            cvss: 2.1,
            timestamp: new Date()
          });
        }
      })
      .catch(() => {
        // אם לא ניתן לבדוק headers
        headerVulns.push({
          id: `header-${Date.now()}`,
          type: 'info',
          title: 'Cannot Check Security Headers',
          description: 'Unable to verify security headers',
          impact: 'Unknown',
          recommendation: 'Manually verify security headers',
          timestamp: new Date()
        });
      });

    return headerVulns;
  }

  // ביצוע audit מלא
  async performFullAudit(): Promise<SecurityAuditResult> {
    const startTime = Date.now();

    // איסוף כל הבדיקות
    const allVulns = [
      ...this.checkXSSVulnerabilities(),
      ...this.checkCSRFVulnerabilities(),
      ...this.checkCSP(),
      ...this.checkHTTPS(),
      ...this.checkSensitiveDataExposure(),
      ...this.checkDependencies(),
      ...this.checkSecurityHeaders()
    ];

    this.vulnerabilities = allVulns;

    // בדיקת GDPR compliance
    const gdprCompliance = this.checkGDPRCompliance();

    // חישוב ציון כללי
    const overallScore = this.calculateOverallScore(allVulns, gdprCompliance);

    // יצירת המלצות
    const recommendations = this.generateRecommendations(allVulns, gdprCompliance);

    const result: SecurityAuditResult = {
      vulnerabilities: allVulns,
      gdprCompliance,
      overallScore,
      recommendations,
      timestamp: new Date()
    };

    this.auditHistory.push(result);

    return result;
  }

  // חישוב ציון כללי
  private calculateOverallScore(vulns: SecurityVulnerability[], gdpr: GDPRCompliance): number {
    let score = 100;

    // הפחתת נקודות עבור vulnerabilities
    vulns.forEach(vuln => {
      switch (vuln.type) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    // הפחתת נקודות עבור GDPR violations
    Object.values(gdpr).forEach(compliant => {
      if (!compliant) {
        score -= 5;
      }
    });

    return Math.max(0, score);
  }

  // יצירת המלצות
  private generateRecommendations(vulns: SecurityVulnerability[], gdpr: GDPRCompliance): string[] {
    const recommendations: string[] = [];

    // המלצות אבטחה
    if (vulns.some(v => v.type === 'high')) {
      recommendations.push('טפל בדחיפות בפגיעויות אבטחה ברמה גבוהה');
    }

    if (vulns.some(v => v.title.includes('XSS'))) {
      recommendations.push('הטמע הגנה מפני XSS attacks');
    }

    if (vulns.some(v => v.title.includes('CSRF'))) {
      recommendations.push('הוסף CSRF tokens לכל הטפסים');
    }

    if (vulns.some(v => v.title.includes('HTTPS'))) {
      recommendations.push('הפעל HTTPS בכל התקשורת');
    }

    // המלצות GDPR
    if (!gdpr.userConsent) {
      recommendations.push('הטמע מנגנון הסכמת משתמשים');
    }

    if (!gdpr.privacyPolicy) {
      recommendations.push('צור מדיניות פרטיות מפורטת');
    }

    if (!gdpr.cookieConsent) {
      recommendations.push('הוסף הסכמה לעוגיות');
    }

    if (!gdpr.dataEncryption) {
      recommendations.push('הצפן את כל הנתונים הרגישים');
    }

    return recommendations;
  }

  // קבלת היסטוריית audits
  getAuditHistory(): SecurityAuditResult[] {
    return this.auditHistory;
  }

  // קבלת vulnerabilities נוכחיות
  getCurrentVulnerabilities(): SecurityVulnerability[] {
    return this.vulnerabilities;
  }

  // ניקוי vulnerabilities ישנות
  clearOldVulnerabilities(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.vulnerabilities = this.vulnerabilities.filter(vuln => 
      vuln.timestamp > cutoffDate
    );
  }

  // יצירת דוח אבטחה
  generateSecurityReport(): string {
    const latestAudit = this.auditHistory[this.auditHistory.length - 1];
    if (!latestAudit) {
      return 'אין נתוני audit זמינים';
    }

    let report = `דוח אבטחה - ${latestAudit.timestamp.toLocaleDateString('he-IL')}\n`;
    report += `ציון כללי: ${latestAudit.overallScore}/100\n\n`;

    report += 'פגיעויות אבטחה:\n';
    latestAudit.vulnerabilities.forEach(vuln => {
      report += `- ${vuln.title} (${vuln.type.toUpperCase()})\n`;
      report += `  ${vuln.description}\n`;
      report += `  המלצה: ${vuln.recommendation}\n\n`;
    });

    report += 'עמידה ב-GDPR:\n';
    Object.entries(latestAudit.gdprCompliance).forEach(([key, compliant]) => {
      report += `- ${key}: ${compliant ? '✓' : '✗'}\n`;
    });

    return report;
  }
}

// יצירת instance גלובלי
export const securityAuditor = new SecurityAuditor();

// פונקציות עזר
export const securityUtils = {
  // ביצוע audit מהיר
  quickAudit: () => securityAuditor.performFullAudit(),

  // בדיקת vulnerability ספציפית
  checkVulnerability: (type: string) => {
    switch (type) {
      case 'xss':
        return securityAuditor.checkXSSVulnerabilities();
      case 'csrf':
        return securityAuditor.checkCSRFVulnerabilities();
      case 'https':
        return securityAuditor.checkHTTPS();
      case 'gdpr':
        return securityAuditor.checkGDPRCompliance();
      default:
        return [];
    }
  },

  // קבלת דוח אבטחה
  getSecurityReport: () => securityAuditor.generateSecurityReport(),

  // ניקוי נתונים ישנים
  cleanupOldData: (days: number) => securityAuditor.clearOldVulnerabilities(days)
};

// Hook ל-React לניהול אבטחה
export const useSecurityAudit = () => {
  return {
    performAudit: () => securityAuditor.performFullAudit(),
    getVulnerabilities: () => securityAuditor.getCurrentVulnerabilities(),
    getHistory: () => securityAuditor.getAuditHistory(),
    generateReport: () => securityAuditor.generateSecurityReport()
  };
};

// ניטור אבטחה אוטומטי
export const startSecurityMonitoring = (interval: number = 24 * 60 * 60 * 1000) => {
  setInterval(async () => {
    try {
      await securityAuditor.performFullAudit();
      console.log('Security audit completed');
    } catch (error) {
      console.error('Security audit failed:', error);
    }
  }, interval);
};

export default SecurityAuditor;
