import { supabase } from './supabase';
import { User } from '../types';

export interface TwoFactorAuth {
  id: string;
  userId: string;
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// יצירת secret חדש ל-2FA
export const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// יצירת backup codes
export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// יצירת QR code URL
export const generateQRCodeUrl = (secret: string, username: string, issuer: string = 'מיטב הרכב'): string => {
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
};

// הגדרת 2FA למשתמש
export const setupTwoFactorAuth = async (userId: string): Promise<TwoFactorSetup> => {
  try {
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    const qrCodeUrl = generateQRCodeUrl(secret, userId);

    // שמירה במסד הנתונים
    const { error } = await supabase
      .from('two_factor_auth')
      .upsert({
        user_id: userId,
        secret: secret,
        is_enabled: false,
        backup_codes: backupCodes
      });

    if (error) throw error;

    return {
      secret,
      qrCode: qrCodeUrl,
      backupCodes
    };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw new Error('שגיאה בהגדרת אימות דו-שלבי');
  }
};

// אימות קוד 2FA
export const verifyTwoFactorCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    // בדיקה אם זה backup code
    const { data: twoFactorData, error: fetchError } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !twoFactorData) {
      throw new Error('אימות דו-שלבי לא מוגדר');
    }

    // בדיקה אם זה backup code
    if (twoFactorData.backup_codes.includes(code)) {
      // הסרת backup code משומש
      const updatedBackupCodes = twoFactorData.backup_codes.filter(c => c !== code);
      await supabase
        .from('two_factor_auth')
        .update({ backup_codes: updatedBackupCodes })
        .eq('user_id', userId);
      
      return true;
    }

    // אימות קוד TOTP
    const isValid = await verifyTOTP(twoFactorData.secret, code);
    return isValid;
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
};

// אימות TOTP (Time-based One-Time Password)
export const verifyTOTP = async (secret: string, code: string): Promise<boolean> => {
  try {
    // חישוב הקוד הנוכחי
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = 30; // 30 שניות
    const window = 1; // חלון זמן של ±1 תקופה

    for (let i = -window; i <= window; i++) {
      const time = currentTime + (i * timeStep);
      const expectedCode = generateTOTP(secret, time);
      
      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

// יצירת TOTP code
export const generateTOTP = (secret: string, time: number): string => {
  // Base32 decode
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const base32Lookup: { [key: string]: number } = {};
  for (let i = 0; i < base32Chars.length; i++) {
    base32Lookup[base32Chars[i]] = i;
  }

  let decoded = '';
  for (let i = 0; i < secret.length; i++) {
    const char = secret[i];
    if (base32Lookup[char] !== undefined) {
      decoded += base32Lookup[char].toString(2).padStart(5, '0');
    }
  }

  // Convert to bytes
  const bytes: number[] = [];
  for (let i = 0; i < decoded.length; i += 8) {
    const byte = decoded.substr(i, 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }

  // Create HMAC-SHA1
  const key = new Uint8Array(bytes);
  const message = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    message[7 - i] = (time >> (i * 8)) & 0xff;
  }

  // Simple HMAC-SHA1 implementation (in production, use crypto library)
  const hmac = await simpleHMACSHA1(key, message);
  
  // Generate 6-digit code
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
};

// פונקציה פשוטה ל-HMAC-SHA1 (בפרודקשן יש להשתמש בספרייה crypto)
const simpleHMACSHA1 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
  // זו פונקציה פשוטה - בפרודקשן יש להשתמש ב-Web Crypto API או ספרייה מתאימה
  const encoder = new TextEncoder();
  const keyString = Array.from(key).map(b => String.fromCharCode(b)).join('');
  const messageString = Array.from(message).map(b => String.fromCharCode(b)).join('');
  
  // יצירת hash פשוט (לא אמיתי - רק לדוגמה)
  const combined = keyString + messageString;
  const hash = await crypto.subtle.digest('SHA-1', encoder.encode(combined));
  
  return new Uint8Array(hash);
};

// הפעלת 2FA למשתמש
export const enableTwoFactorAuth = async (userId: string, code: string): Promise<boolean> => {
  try {
    const isValid = await verifyTwoFactorCode(userId, code);
    
    if (isValid) {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({ is_enabled: true })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return false;
  }
};

// ביטול 2FA למשתמש
export const disableTwoFactorAuth = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('two_factor_auth')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return false;
  }
};

// בדיקה אם 2FA מופעל למשתמש
export const isTwoFactorEnabled = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('is_enabled')
      .eq('user_id', userId)
      .single();

    if (error) return false;
    return data?.is_enabled || false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};

// קבלת פרטי 2FA של משתמש
export const getTwoFactorAuth = async (userId: string): Promise<TwoFactorAuth | null> => {
  try {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      secret: data.secret,
      isEnabled: data.is_enabled,
      backupCodes: data.backup_codes || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error getting 2FA data:', error);
    return null;
  }
};

// יצירת backup codes חדשים
export const regenerateBackupCodes = async (userId: string): Promise<string[]> => {
  try {
    const backupCodes = generateBackupCodes();
    
    const { error } = await supabase
      .from('two_factor_auth')
      .update({ backup_codes: backupCodes })
      .eq('user_id', userId);

    if (error) throw error;
    return backupCodes;
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw new Error('שגיאה ביצירת backup codes חדשים');
  }
};

// בדיקת תקינות backup code
export const isValidBackupCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('backup_codes')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;
    
    return data.backup_codes.includes(code);
  } catch (error) {
    console.error('Error validating backup code:', error);
    return false;
  }
};

// יצירת session עם 2FA
export const createTwoFactorSession = async (userId: string): Promise<string> => {
  try {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 דקות

    const { error } = await supabase
      .from('two_factor_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
    return sessionId;
  } catch (error) {
    console.error('Error creating 2FA session:', error);
    throw new Error('שגיאה ביצירת session');
  }
};

// אימות session 2FA
export const validateTwoFactorSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('two_factor_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) return false;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // מחיקת session פג תוקף
      await supabase
        .from('two_factor_sessions')
        .delete()
        .eq('session_id', sessionId);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating 2FA session:', error);
    return false;
  }
};

// מחיקת session 2FA
export const deleteTwoFactorSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('two_factor_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting 2FA session:', error);
    return false;
  }
};
