# Strong Luxury Cars - Database Schema
# סכמת מסד נתונים לאתר מכירת רכבים

## מבנה הטבלאות

### 1. טבלת רכבים (cars)
הטבלה הראשית שמכילה את כל פרטי הרכבים למכירה.

**שדות עיקריים:**
- `id` - מזהה ייחודי (UUID)
- `name` - שם הרכב (למשל: "BMW X5 2023")
- `brand` - יצרן (למשל: "BMW")
- `model` - דגם (למשל: "X5")
- `year` - שנת ייצור
- `price` - מחיר
- `kilometers` - קילומטראז'
- `transmission` - תיבת הילוכים (manual/automatic)
- `fuel_type` - סוג דלק (gasoline/diesel/hybrid/electric)
- `color` - צבע
- `description` - תיאור מפורט
- `features` - מערך של תכונות
- `condition` - מצב (new/used)
- `inventory_status` - סטטוס מלאי (in_stock/reserved/sold/maintenance/test_drive)
- `is_active` - האם הרכב פעיל במערכת

### 2. טבלת קבצי מדיה (media_files)
מכילה את כל התמונות והסרטונים של הרכבים.

**שדות עיקריים:**
- `id` - מזהה ייחודי
- `filename` - שם הקובץ במערכת
- `original_name` - שם הקובץ המקורי
- `type` - סוג (image/video)
- `url` - כתובת הקובץ
- `car_id` - קישור לרכב

### 3. טבלת לידים (leads)
מכילה את כל הפניות מלקוחות.

**שדות עיקריים:**
- `id` - מזהה ייחודי
- `first_name`, `last_name` - שם מלא
- `email`, `phone`, `whatsapp` - פרטי קשר
- `source` - מקור הליד (website/whatsapp/phone/email/social/referral)
- `status` - סטטוס (new/contacted/qualified/proposal/negotiation/closed/lost)
- `priority` - עדיפות (low/medium/high/urgent)
- `interest_in_car` - קישור לרכב שמעניין את הלקוח
- `budget` - תקציב
- `timeline` - לוח זמנים לרכישה

## אינדקסים

נוצרו אינדקסים על השדות הבאים לביצועים מיטביים:
- `cars`: brand, model, year, price, condition, inventory_status, is_active, created_at
- `media_files`: car_id, type
- `leads`: status, priority, source, created_at, interest_in_car

## אבטחה

- **Row Level Security (RLS)** מופעל על כל הטבלאות
- **Policies** מוגדרות לכל טבלה:
  - רכבים: כולם יכולים לצפות, רק משתמשים מורשים יכולים לערוך
  - לידים: כולם יכולים ליצור, רק משתמשים מורשים יכולים לצפות ולערוך
  - קבצי מדיה: כולם יכולים לצפות, רק משתמשים מורשים יכולים לנהל

## טריגרים

- **update_updated_at_column** - מעדכן אוטומטית את שדה `updated_at` בכל עדכון

## מיגרציות

הקובץ `001_initial_schema.sql` מכיל את המיגרציה הראשונית עם הטבלאות הבסיסיות.

## שימוש

1. הרץ את המיגרציה הראשונית: `001_initial_schema.sql`
2. הגדר את משתני הסביבה של Supabase
3. הפעל את האפליקציה

## הערות חשובות

- כל המזהים הם UUID במקום מספרים שלמים
- שדות תאריך משתמשים ב-TIMESTAMP WITH TIME ZONE
- מערכים (arrays) משמשים לשמירת תכונות, תגיות ומילות מפתח
- כל הטבלאות כוללות שדות `created_at` ו-`updated_at`
