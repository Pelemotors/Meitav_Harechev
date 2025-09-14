# מדריך תיקון אבטחה - הגבלת גישה למנהל אחד בלבד

## הבעיה
- יש 10 משתמשים במערכת במקום מנהל אחד
- הכניסה למנהלים מתאפשרת בלי זיהוי נכון
- חסרה הגבלת משתמש יחיד

## הפתרון שיושם

### 1. עדכון מערכת האימות
- **קובץ**: `src/utils/auth.ts`
- **שינויים**:
  - `getCurrentUser()` עכשיו בודק עם Supabase Auth
  - הוספת `validateSingleAdmin()` לבדיקת הרשאות
  - הוספת `checkUserCount()` לבדיקת מספר משתמשים

### 2. עדכון AuthContext
- **קובץ**: `src/contexts/AuthContext.tsx`
- **שינויים**:
  - הוספת listener לשינויים ב-Supabase Auth
  - עדכון אוטומטי של מצב המשתמש
  - התנתקות אוטומטית כשהסשן נגמר

### 3. עדכון ProtectedRoute
- **קובץ**: `src/components/ProtectedRoute.tsx`
- **שינויים**:
  - בדיקת הרשאות עם Supabase
  - הודעות שגיאה ברורות
  - טעינה בזמן בדיקת הרשאות

## צעדים לתיקון במסד הנתונים

### שלב 1: ניקוי משתמשים
הרץ את הסקריפט הבא ב-Supabase SQL Editor:

```sql
-- מחיקת כל המשתמשים מלבד המנהל המורשה
DELETE FROM auth.users 
WHERE email != 'admin@meitav.com';
```

### שלב 2: הגבלת רישום משתמשים
הרץ את הסקריפט הבא ב-Supabase SQL Editor:

```sql
-- יצירת טריגר למניעת רישום משתמשים מרובים
CREATE OR REPLACE FUNCTION check_user_registration_allowed()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count > 0 THEN
        RAISE EXCEPTION 'User registration is not allowed. Only one admin user is permitted in this system.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_multiple_users
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_registration_allowed();
```

### שלב 3: עדכון .env
וודא שקובץ ה-.env מכיל:

```
VITE_SUPABASE_URL=https://svwyymrdwoshekbieszm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_nj1vbwbRRjSMA29LKB6V9A_PZilsszH
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_fbP4DB3pCWiCTO6h1bukSQ_11i-7t8p
```

## בדיקות לאמת התיקון

1. **בדיקת מספר משתמשים**: בממשק Supabase, לך ל-Authentication > Users
   - אמור להיות משתמש אחד בלבד: `admin@meitav.com`

2. **בדיקת התחברות**: נסה להתחבר עם:
   - אימייל: `admin@meitav.com`
   - סיסמה: הסיסמה שהגדרת

3. **בדיקת הגנה**: נסה לגשת לדף הניהול בלי להתחבר
   - אמור להופיע הודעת "נדרשת התחברות"

4. **בדיקת התנתקות**: התנתק ונסה לגשת שוב
   - אמור להופיע הודעת "נדרשת התחברות"

## הערות חשובות

- **רק משתמש אחד מורשה**: `admin@meitav.com`
- **הגנה מפני רישום חדש**: הטריגר מונע יצירת משתמשים נוספים
- **בדיקת הרשאות**: המערכת בודקת עם Supabase בכל פעם
- **התנתקות אוטומטית**: כשהסשן נגמר, המשתמש מותנתק אוטומטית

## אם עדיין יש בעיות

1. נקה את ה-localStorage בדפדפן
2. רענן את הדף
3. התחבר מחדש עם `admin@meitav.com`
4. בדוק בקונסול של הדפדפן אם יש שגיאות
