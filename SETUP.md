# 🚗 Strong Luxury Cars - Setup Guide
# מדריך הגדרה לאתר מכירת רכבים

## 📋 **שלבי ההגדרה**

### **שלב 1: הגדרת משתני הסביבה**

צור קובץ `.env` בתיקיית השורש של הפרויקט עם התוכן הבא:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://muhzzektnfulszswsntk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_0Bh2T7VXG0lnRqXVm8Yvcw_1PDfxG1c

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_zA__BtYSQQ8m60ySd62BGA_ESTIlxg2

# Application Configuration
VITE_APP_NAME="Strong Luxury Cars"
VITE_APP_URL=http://localhost:5173

# WhatsApp Configuration
VITE_WHATSAPP_PHONE=972505666620

# Email Configuration (for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google Analytics (for future use)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### **שלב 2: הגדרת מסד הנתונים**

1. היכנס ללוח הבקרה של Supabase: https://supabase.com/dashboard
2. בחר את הפרויקט: `muhzzektnfulszswsntk`
3. עבור ל-SQL Editor
4. העתק והדבק את התוכן מקובץ `database/migrations/001_initial_schema.sql`
5. הרץ את המיגרציה

### **שלב 3: הגדרת Storage Buckets**

1. בלוח הבקרה של Supabase, עבור ל-Storage
2. צור bucket חדש בשם `cars-media`
3. הגדר את ההרשאות הבאות:
   - **Public bucket**: כן
   - **File size limit**: 50MB
   - **Allowed MIME types**: image/*, video/*

### **שלב 4: הגדרת RLS Policies**

המיגרציה כוללת את כל ה-RLS Policies הנדרשות, אבל אם צריך לעדכן:

1. עבור ל-Authentication > Policies
2. ודא שכל הטבלאות מוגנות ב-RLS
3. ודא שהמדיניות מוגדרות נכון

### **שלב 5: הרצת האפליקציה**

```bash
# התקנת תלויות
npm install

# הרצת השרת
npm run dev
```

## 🔧 **בדיקת החיבור**

### **בדיקה 1: חיבור בסיסי**
פתח את הדפדפן ובדוק שהאפליקציה נטענת ללא שגיאות.

### **בדיקה 2: בדיקת מסד נתונים**
1. עבור ל-`/admin`
2. נסה להיכנס למערכת הניהול
3. בדוק שהטבלאות נוצרו נכון

### **בדיקה 3: בדיקת Storage**
1. נסה להעלות תמונה במערכת הניהול
2. בדוק שהתמונה נשמרת ב-Storage

## 🚨 **פתרון בעיות נפוצות**

### **שגיאה: "Missing Supabase environment variables"**
- ודא שקובץ `.env` קיים בתיקיית השורש
- ודא שהמפתחות נכונים
- הפעל מחדש את השרת

### **שגיאה: "Table does not exist"**
- ודא שהמיגרציה רצה בהצלחה
- בדוק את לוגי השרת ב-Supabase

### **שגיאה: "Permission denied"**
- בדוק שה-RLS Policies מוגדרות נכון
- ודא שהמפתחות הנכונים משמשים

## 📞 **תמיכה**

אם יש בעיות:
1. בדוק את הלוגים בקונסול הדפדפן
2. בדוק את הלוגים בלוח הבקרה של Supabase
3. ודא שכל השלבים בוצעו נכון

## 🎯 **השלב הבא**

לאחר שהחיבור עובד:
1. הוסף רכבים דרך מערכת הניהול
2. בדוק שהרכבים מוצגים בדף הראשי
3. בדוק את פונקציונליות החיפוש והסינון
4. בדוק את טופס יצירת קשר
