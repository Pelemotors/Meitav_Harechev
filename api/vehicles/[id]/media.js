import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'POST') {
      // Upload media file
      const formData = await req.formData();
      const file = formData.get('file');
      const carId = formData.get('carId');

      if (!file || !carId) {
        return res.status(400).json({ error: 'Missing file or carId' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${carId}/${timestamp}_${file.name}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cars-media')
        .upload(filename, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cars-media')
        .getPublicUrl(filename);

      // Save to database
      const { data: mediaData, error: dbError } = await supabase
        .from('media_files')
        .insert({
          car_id: carId,
          filename: filename,
          file_type: file.type,
          file_size: file.size,
          url: urlData.publicUrl
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      res.status(200).json({ 
        success: true, 
        media: mediaData 
      });
    } else if (req.method === 'GET') {
      // Get media files for vehicle
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('car_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      res.status(200).json({ media: data || [] });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
