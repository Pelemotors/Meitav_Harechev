# 🚀 **הגדרת Storage - הוראות מהירות**

## ⚡ **שלב 1: יצירת Storage Bucket**

1. **היכנס ללוח הבקרה של Supabase**: https://supabase.com/dashboard
2. **בחר את הפרויקט**: `muhzzektnfulszswsntk`
3. **עבור ל-Storage** (בצד שמאל)
4. **לחץ על "New bucket"**

## ⚙️ **שלב 2: הגדרת Bucket**

**שם Bucket:** `cars-media`

**הגדרות:**
- ✅ **Public bucket** - כן
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*, video/*`

## 🔐 **שלב 3: הגדרת הרשאות (חובה!)**

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

## ✅ **בדיקה**

1. **היכנס לאפליקציה**: http://localhost:5174/admin
2. **נסה להוסיף רכב חדש**
3. **העלה תמונה**
4. **שמור את הרכב**

## 🎉 **סיום**

אחרי השלמת השלבים האלה, העלאת תמונות תעבוד!

---

**קישורים:**
- 🏠 **דף ראשי**: http://localhost:5174
- ⚙️ **מערכת ניהול**: http://localhost:5174/admin
- 📊 **לוח בקרה סופבייס**: https://supabase.com/dashboard/project/muhzzektnfulszswsntk
