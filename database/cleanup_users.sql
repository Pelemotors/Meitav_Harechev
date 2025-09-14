-- Cleanup Users Script
-- סקריפט לניקוי משתמשים - משאיר רק מנהל אחד מורשה

-- First, let's see how many users we have
SELECT 'Current user count:' as info, COUNT(*) as count FROM auth.users;

-- Delete all users except the authorized admin (admin@meitav.com)
-- מחיקת כל המשתמשים מלבד המנהל המורשה
DELETE FROM auth.users 
WHERE email != 'admin@meitav.com';

-- Verify only one user remains
SELECT 'Remaining users:' as info, COUNT(*) as count FROM auth.users;

-- Show the remaining user
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users;

-- Clean up any orphaned user records in custom tables
-- ניקוי רשומות יתומות בטבלאות מותאמות אישית
DELETE FROM users WHERE id NOT IN (
    SELECT id FROM auth.users
);

-- Success message
SELECT 'User cleanup completed successfully! Only authorized admin remains.' as status;
