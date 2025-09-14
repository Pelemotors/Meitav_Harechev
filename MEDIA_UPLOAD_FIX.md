# תיקון שגיאת העלאת קבצי מדיה

## הבעיה
```
StorageApiError: new row violates row-level security policy
```

## הסבר השגיאה
השגיאה נגרמת מכך שמדיניות ה-Row Level Security (RLS) ב-Supabase לא מאפשרת הכנסת נתונים לטבלת `media_files`.

## הפתרון

### שלב 1: הרץ את הסקריפט SQL ב-Supabase
לך ל-Supabase Dashboard > SQL Editor והרץ את הקוד הבא:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Media files are viewable by everyone" ON media_files;
DROP POLICY IF EXISTS "Media files are insertable by authenticated users" ON media_files;
DROP POLICY IF EXISTS "Media files are updatable by authenticated users" ON media_files;
DROP POLICY IF EXISTS "Media files are deletable by authenticated users" ON media_files;

-- Create new policies for media_files
CREATE POLICY "Media files are viewable by everyone" ON media_files
    FOR SELECT USING (true);

CREATE POLICY "Media files are insertable by authenticated users" ON media_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Media files are updatable by authenticated users" ON media_files
    FOR UPDATE USING (true);

CREATE POLICY "Media files are deletable by authenticated users" ON media_files
    FOR DELETE USING (true);
```

### שלב 2: וודא שהמשתמש מחובר
הקוד עודכן כדי לבדוק שהמשתמש מחובר לפני העלאת קבצים.

### שלב 3: בדוק Storage Bucket
וודא שקיים bucket בשם `cars-media` ב-Supabase Storage:

1. לך ל-Supabase Dashboard > Storage
2. אם אין bucket בשם `cars-media`, צור אותו
3. הגדר אותו כ-Public

### שלב 4: הגדר הרשאות Storage
וודא שההרשאות נכונות:

1. לך ל-Storage > Settings
2. הגדר את ה-bucket `cars-media` כ-Public
3. וודא שמשתמשים מורשים יכולים להעלות קבצים

## בדיקות לאמת התיקון

1. **נסה להעלות קובץ תמונה** דרך טופס הוספת רכב
2. **בדוק בקונסול** שהמשתמש מוכר כ-authenticated
3. **בדוק ב-Supabase Dashboard** שהקובץ הועלה ל-Storage
4. **בדוק בטבלת `media_files`** שהרשומה נוצרה

## אם עדיין יש בעיות

1. **בדוק את ה-.env** - וודא שה-URL וה-keys נכונים
2. **נקה localStorage** ורענן את הדף
3. **התחבר מחדש** עם admin@meitav.com
4. **בדוק בקונסול** אם יש שגיאות נוספות

## הודעות שגיאה נפוצות

- **"User must be authenticated"** - המשתמש לא מחובר
- **"StorageApiError"** - בעיה עם Storage או RLS policies
- **"File too large"** - הקובץ גדול מדי (מקסימום 50MB)

## סיכום
הבעיה הייתה במדיניות RLS שלא אפשרה הכנסת נתונים לטבלת media_files. התיקון כולל:
1. עדכון מדיניות RLS
2. בדיקת אימות משתמש
3. וידוא הגדרות Storage
