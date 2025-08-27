// מערכת הצפנה לנתונים רגישים
// שימוש ב-Web Crypto API להצפנה מאובטחת

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

// יצירת מפתח הצפנה מ-password
export const deriveKeyFromPassword = async (
  password: string,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(16))
): Promise<EncryptionKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // יצירת key מ-password באמצעות PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  return { key, salt };
};

// הצפנת טקסט
export const encryptText = async (
  text: string,
  password: string,
  salt?: Uint8Array
): Promise<EncryptedData> => {
  try {
    const { key, salt: derivedSalt } = await deriveKeyFromPassword(password, salt);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // יצירת IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // הצפנת הנתונים
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...derivedSalt))
    };
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw new Error('שגיאה בהצפנת הנתונים');
  }
};

// פענוח טקסט
export const decryptText = async (
  encryptedData: EncryptedData,
  password: string
): Promise<string> => {
  try {
    // המרת הנתונים המוצפנים חזרה ל-Uint8Array
    const data = new Uint8Array(atob(encryptedData.data).split('').map(char => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(encryptedData.iv).split('').map(char => char.charCodeAt(0)));
    const salt = new Uint8Array(atob(encryptedData.salt).split('').map(char => char.charCodeAt(0)));
    
    // יצירת מפתח הצפנה
    const { key } = await deriveKeyFromPassword(password, salt);
    
    // פענוח הנתונים
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw new Error('שגיאה בפענוח הנתונים');
  }
};

// הצפנת אובייקט JSON
export const encryptObject = async (
  obj: any,
  password: string,
  salt?: Uint8Array
): Promise<EncryptedData> => {
  const jsonString = JSON.stringify(obj);
  return await encryptText(jsonString, password, salt);
};

// פענוח אובייקט JSON
export const decryptObject = async (
  encryptedData: EncryptedData,
  password: string
): Promise<any> => {
  const jsonString = await decryptText(encryptedData, password);
  return JSON.parse(jsonString);
};

// הצפנת נתונים רגישים של משתמש
export const encryptUserData = async (
  userData: {
    email: string;
    phone?: string;
    whatsapp?: string;
    notes?: string;
  },
  masterPassword: string
): Promise<{
  encryptedEmail: EncryptedData;
  encryptedPhone?: EncryptedData;
  encryptedWhatsapp?: EncryptedData;
  encryptedNotes?: EncryptedData;
}> => {
  const result: any = {
    encryptedEmail: await encryptText(userData.email, masterPassword)
  };
  
  if (userData.phone) {
    result.encryptedPhone = await encryptText(userData.phone, masterPassword);
  }
  
  if (userData.whatsapp) {
    result.encryptedWhatsapp = await encryptText(userData.whatsapp, masterPassword);
  }
  
  if (userData.notes) {
    result.encryptedNotes = await encryptText(userData.notes, masterPassword);
  }
  
  return result;
};

// פענוח נתונים רגישים של משתמש
export const decryptUserData = async (
  encryptedData: {
    encryptedEmail: EncryptedData;
    encryptedPhone?: EncryptedData;
    encryptedWhatsapp?: EncryptedData;
    encryptedNotes?: EncryptedData;
  },
  masterPassword: string
): Promise<{
  email: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
}> => {
  const result: any = {
    email: await decryptText(encryptedData.encryptedEmail, masterPassword)
  };
  
  if (encryptedData.encryptedPhone) {
    result.phone = await decryptText(encryptedData.encryptedPhone, masterPassword);
  }
  
  if (encryptedData.encryptedWhatsapp) {
    result.whatsapp = await decryptText(encryptedData.encryptedWhatsapp, masterPassword);
  }
  
  if (encryptedData.encryptedNotes) {
    result.notes = await decryptText(encryptedData.encryptedNotes, masterPassword);
  }
  
  return result;
};

// הצפנת פרטי תשלום
export const encryptPaymentData = async (
  paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  },
  password: string
): Promise<{
  encryptedCardNumber: EncryptedData;
  encryptedExpiryDate: EncryptedData;
  encryptedCvv: EncryptedData;
  encryptedCardholderName: EncryptedData;
}> => {
  return {
    encryptedCardNumber: await encryptText(paymentData.cardNumber, password),
    encryptedExpiryDate: await encryptText(paymentData.expiryDate, password),
    encryptedCvv: await encryptText(paymentData.cvv, password),
    encryptedCardholderName: await encryptText(paymentData.cardholderName, password)
  };
};

// פענוח פרטי תשלום
export const decryptPaymentData = async (
  encryptedData: {
    encryptedCardNumber: EncryptedData;
    encryptedExpiryDate: EncryptedData;
    encryptedCvv: EncryptedData;
    encryptedCardholderName: EncryptedData;
  },
  password: string
): Promise<{
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}> => {
  return {
    cardNumber: await decryptText(encryptedData.encryptedCardNumber, password),
    expiryDate: await decryptText(encryptedData.encryptedExpiryDate, password),
    cvv: await decryptText(encryptedData.encryptedCvv, password),
    cardholderName: await decryptText(encryptedData.encryptedCardholderName, password)
  };
};

// הצפנת API keys
export const encryptApiKey = async (apiKey: string, masterPassword: string): Promise<EncryptedData> => {
  return await encryptText(apiKey, masterPassword);
};

// פענוח API keys
export const decryptApiKey = async (encryptedApiKey: EncryptedData, masterPassword: string): Promise<string> => {
  return await decryptText(encryptedApiKey, masterPassword);
};

// הצפנת פרטי WhatsApp
export const encryptWhatsAppCredentials = async (
  credentials: {
    phoneNumber: string;
    sessionData?: string;
    apiKey?: string;
  },
  password: string
): Promise<{
  encryptedPhoneNumber: EncryptedData;
  encryptedSessionData?: EncryptedData;
  encryptedApiKey?: EncryptedData;
}> => {
  const result: any = {
    encryptedPhoneNumber: await encryptText(credentials.phoneNumber, password)
  };
  
  if (credentials.sessionData) {
    result.encryptedSessionData = await encryptText(credentials.sessionData, password);
  }
  
  if (credentials.apiKey) {
    result.encryptedApiKey = await encryptText(credentials.apiKey, password);
  }
  
  return result;
};

// פענוח פרטי WhatsApp
export const decryptWhatsAppCredentials = async (
  encryptedData: {
    encryptedPhoneNumber: EncryptedData;
    encryptedSessionData?: EncryptedData;
    encryptedApiKey?: EncryptedData;
  },
  password: string
): Promise<{
  phoneNumber: string;
  sessionData?: string;
  apiKey?: string;
}> => {
  const result: any = {
    phoneNumber: await decryptText(encryptedData.encryptedPhoneNumber, password)
  };
  
  if (encryptedData.encryptedSessionData) {
    result.sessionData = await decryptText(encryptedData.encryptedSessionData, password);
  }
  
  if (encryptedData.encryptedApiKey) {
    result.apiKey = await decryptText(encryptedData.encryptedApiKey, password);
  }
  
  return result;
};

// יצירת hash מאובטח לסיסמאות
export const hashPassword = async (password: string, salt?: Uint8Array): Promise<{
  hash: string;
  salt: string;
}> => {
  const passwordSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    hash,
    salt: btoa(String.fromCharCode(...passwordSalt))
  };
};

// אימות סיסמה
export const verifyPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  const { hash: computedHash } = await hashPassword(password, new Uint8Array(atob(salt).split('').map(char => char.charCodeAt(0))));
  return computedHash === hash;
};

// יצירת token מאובטח
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// הצפנת token
export const encryptToken = async (token: string, secretKey: string): Promise<EncryptedData> => {
  return await encryptText(token, secretKey);
};

// פענוח token
export const decryptToken = async (encryptedToken: EncryptedData, secretKey: string): Promise<string> => {
  return await decryptText(encryptedToken, secretKey);
};

// בדיקת חוזק סיסמה
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;
  
  // אורך מינימלי
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('הסיסמה חייבת להכיל לפחות 8 תווים');
  }
  
  // אותיות גדולות
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('הוסף אותיות גדולות');
  }
  
  // אותיות קטנות
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('הוסף אותיות קטנות');
  }
  
  // מספרים
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('הוסף מספרים');
  }
  
  // תווים מיוחדים
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('הוסף תווים מיוחדים');
  }
  
  // אורך ארוך
  if (password.length >= 12) {
    score += 1;
  }
  
  return {
    score,
    feedback,
    isStrong: score >= 4
  };
};

// ניהול מפתחות הצפנה
export class EncryptionKeyManager {
  private static instance: EncryptionKeyManager;
  private keys: Map<string, EncryptionKey> = new Map();
  
  private constructor() {}
  
  static getInstance(): EncryptionKeyManager {
    if (!EncryptionKeyManager.instance) {
      EncryptionKeyManager.instance = new EncryptionKeyManager();
    }
    return EncryptionKeyManager.instance;
  }
  
  async getKey(password: string, salt?: Uint8Array): Promise<EncryptionKey> {
    const keyId = salt ? btoa(String.fromCharCode(...salt)) : password;
    
    if (!this.keys.has(keyId)) {
      const key = await deriveKeyFromPassword(password, salt);
      this.keys.set(keyId, key);
    }
    
    return this.keys.get(keyId)!;
  }
  
  clearKeys(): void {
    this.keys.clear();
  }
  
  removeKey(keyId: string): boolean {
    return this.keys.delete(keyId);
  }
}

// יצירת master key למערכת
export const generateMasterKey = (): string => {
  return generateSecureToken(64);
};

// שמירת master key מאובטחת
export const storeMasterKey = (masterKey: string): void => {
  // בפועל יש לשמור את זה בצורה מאובטחת יותר
  // למשל ב-Secure Storage או ב-Keychain
  sessionStorage.setItem('masterKey', masterKey);
};

// קבלת master key
export const getMasterKey = (): string | null => {
  return sessionStorage.getItem('masterKey');
};

// מחיקת master key
export const clearMasterKey = (): void => {
  sessionStorage.removeItem('masterKey');
};
