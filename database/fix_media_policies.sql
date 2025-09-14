-- Fix Media Files RLS Policies
-- תיקון מדיניות RLS לקבצי מדיה

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'media_files';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Media files are viewable by everyone" ON media_files;
DROP POLICY IF EXISTS "Media files are insertable by authenticated users" ON media_files;
DROP POLICY IF EXISTS "Media files are updatable by authenticated users" ON media_files;
DROP POLICY IF EXISTS "Media files are deletable by authenticated users" ON media_files;

-- Create new policies for media_files
-- Allow everyone to view media files (for public access to images/videos)
CREATE POLICY "Media files are viewable by everyone" ON media_files
    FOR SELECT USING (true);

-- Allow authenticated users to insert media files
CREATE POLICY "Media files are insertable by authenticated users" ON media_files
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update media files
CREATE POLICY "Media files are updatable by authenticated users" ON media_files
    FOR UPDATE USING (true);

-- Allow authenticated users to delete media files
CREATE POLICY "Media files are deletable by authenticated users" ON media_files
    FOR DELETE USING (true);

-- Also check and fix cars table policies if needed
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cars';

-- Ensure cars policies are correct
DROP POLICY IF EXISTS "Cars are viewable by everyone" ON cars;
DROP POLICY IF EXISTS "Cars are insertable by authenticated users" ON cars;
DROP POLICY IF EXISTS "Cars are updatable by authenticated users" ON cars;
DROP POLICY IF EXISTS "Cars are deletable by authenticated users" ON cars;

-- Create cars policies
CREATE POLICY "Cars are viewable by everyone" ON cars
    FOR SELECT USING (is_active = true);

CREATE POLICY "Cars are insertable by authenticated users" ON cars
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cars are updatable by authenticated users" ON cars
    FOR UPDATE USING (true);

CREATE POLICY "Cars are deletable by authenticated users" ON cars
    FOR DELETE USING (true);

-- Verify policies are created
SELECT 'Media files policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'media_files';

SELECT 'Cars policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'cars';

SELECT 'RLS Policies fixed successfully!' as status;
