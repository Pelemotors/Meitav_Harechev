# 🗂️ Storage Setup - הגדרת אחסון קבצים

## 📋 **שלבי הגדרת Storage**

### **שלב 1: יצירת Storage Bucket**

1. היכנס ללוח הבקרה של Supabase: https://supabase.com/dashboard
2. בחר את הפרויקט: `muhzzektnfulszswsntk`
3. עבור לתפריט **Storage** (בצד שמאל)
4. לחץ על **New bucket**

### **שלב 2: הגדרת Bucket**

**שם Bucket:** `cars-media`

**הגדרות:**
- ✅ **Public bucket** - כן (כדי שהתמונות יהיו נגישות מהאתר)
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*, video/*`

### **שלב 3: הגדרת RLS Policies ל-Storage**

לאחר יצירת ה-Bucket, עבור ל-**Policies** והוסף:

```sql
-- Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'cars-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'cars-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'cars-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'cars-media' AND auth.role() = 'authenticated');
```

### **שלב 4: בדיקה**

1. נסה להעלות תמונה דרך מערכת הניהול
2. בדוק שהתמונה נגישה מהאתר
3. בדוק שהתמונה מוצגת בדף הרכב

## ✅ **סיום**

לאחר השלמת השלבים האלה, האפליקציה תהיה מוכנה לשימוש מלא!
