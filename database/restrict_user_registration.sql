-- Restrict User Registration Script
-- סקריפט להגבלת רישום משתמשים - רק משתמש אחד מורשה

-- Create a function to check if user registration should be allowed
-- יצירת פונקציה לבדיקה אם רישום משתמש מותר
CREATE OR REPLACE FUNCTION check_user_registration_allowed()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- If there are already users, prevent registration
    IF user_count > 0 THEN
        RAISE EXCEPTION 'User registration is not allowed. Only one admin user is permitted in this system.';
    END IF;
    
    -- Allow registration if no users exist
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent multiple user registrations
-- יצירת טריגר למניעת רישום משתמשים מרובים
DROP TRIGGER IF EXISTS prevent_multiple_users ON auth.users;
CREATE TRIGGER prevent_multiple_users
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION check_user_registration_allowed();

-- Also create a policy to restrict user creation
-- יצירת מדיניות להגבלת יצירת משתמשים
DROP POLICY IF EXISTS "Allow only one user registration" ON auth.users;
CREATE POLICY "Allow only one user registration" ON auth.users
    FOR INSERT
    WITH CHECK (
        (SELECT COUNT(*) FROM auth.users) = 0
    );

-- Success message
SELECT 'User registration restrictions applied successfully!' as status;
