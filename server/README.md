# Sitemap Server - Strong Luxury Cars

שרת Node.js ליצירת Sitemap דינמי עבור אתר Strong Luxury Cars.

## תכונות

- יצירת Sitemap XML דינמי עם כל הרכבים הפעילים
- יצירת Sitemap נפרד לרכבים בלבד
- יצירת Sitemap Index
- יצירת קובץ Robots.txt
- סטטיסטיקות Sitemap
- Cache headers לאופטימיזציה
- תמיכה ב-CORS

## התקנה

```bash
cd server
npm install
```

## הפעלה

### פיתוח
```bash
npm run dev
```

### Production
```bash
npm start
```

## Endpoints

### Sitemap מלא
```
GET /api/sitemap
```
מחזיר Sitemap XML עם כל הדפים באתר כולל דפי רכבים בודדים.

### Sitemap רכבים בלבד
```
GET /api/sitemap-cars
```
מחזיר Sitemap XML עם דפי רכבים בודדים בלבד.

### Sitemap Index
```
GET /api/sitemap-index
```
מחזיר Sitemap Index XML שמכיל הפניות לכל ה-Sitemaps.

### Robots.txt
```
GET /api/robots
```
מחזיר קובץ Robots.txt מותאם לאתר.

### סטטיסטיקות
```
GET /api/sitemap-stats
```
מחזיר סטטיסטיקות על ה-Sitemap (מספר URL-ים, רכבים וכו').

### Health Check
```
GET /api/health
```
בדיקת תקינות השרת.

## משתני סביבה

צור קובץ `.env` בתיקיית השרת:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BASE_URL=https://strongluxurycars.com
PORT=3001
```

## מבנה Sitemap

### דף הבית
- URL: `/`
- Priority: 1.0
- Change Frequency: daily

### דף הרכבים
- URL: `/cars`
- Priority: 0.9
- Change Frequency: hourly

### דפי רכבים בודדים
- URL: `/car/{id}`
- Priority: 0.8
- Change Frequency: weekly
- Last Modified: תאריך עדכון הרכב

## Cache

- Sitemap: Cache לשעה (3600 שניות)
- Robots.txt: Cache ליום (86400 שניות)
- Sitemap Index: Cache לשעה (3600 שניות)

## דוגמאות שימוש

### יצירת Sitemap מלא
```bash
curl http://localhost:3001/api/sitemap
```

### יצירת Robots.txt
```bash
curl http://localhost:3001/api/robots
```

### קבלת סטטיסטיקות
```bash
curl http://localhost:3001/api/sitemap-stats
```

## אינטגרציה עם Google Search Console

1. הוסף את ה-Sitemap ל-Google Search Console:
   - `https://strongluxurycars.com/sitemap.xml`
   - `https://strongluxurycars.com/sitemap-cars.xml`

2. וודא שקובץ `robots.txt` מכיל הפניות ל-Sitemaps

3. בדוק שהכל עובד ב-Google Search Console

## פתרון בעיות

### שגיאה בקבלת רכבים
- וודא שמשתני הסביבה של Supabase נכונים
- בדוק שהטבלה `cars` קיימת ונגישה

### שגיאות CORS
- השרת מוגדר עם CORS פתוח לפיתוח
- ב-Production יש להגביל ל-domains ספציפיים

### בעיות Cache
- השרת שולח headers מתאימים ל-Cache
- בדוק שהפרוקסי לא חוסם את ה-Cache headers

## לוגים

השרת מדפיס לוגים לקונסול:
- התחלת שרת
- שגיאות בקבלת נתונים
- בקשות ל-endpoints

## אבטחה

- השרת לא דורש אימות (public endpoints)
- יש להגן על השרת ב-Production עם HTTPS
- מומלץ להוסיף Rate Limiting ב-Production
