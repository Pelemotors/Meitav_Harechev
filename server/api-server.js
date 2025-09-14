const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const Joi = require('joi');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { createClient } = require('@supabase/supabase-js');
const aiRoutes = require('./ai-routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
});
app.use('/api/', limiter);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', { 
      originalname: file.originalname, 
      mimetype: file.mimetype,
      fieldname: file.fieldname 
    });
    
    // Allow more file types and be more permissive
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'video/mp4', 'video/webm', 'video/avi', 'video/mov',
      'application/octet-stream' // Fallback for unknown types
    ];
    
    // Check if file type is allowed or if it's a common image/video extension
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'avi', 'mov'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('File accepted:', file.originalname, file.mimetype);
      cb(null, true);
    } else {
      console.log('File type not allowed:', file.mimetype, 'Extension:', fileExtension);
      cb(new Error(`סוג קובץ לא נתמך: ${file.mimetype}`), false);
    }
  }
});

// Validation schemas
const vehicleSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  brand: Joi.string().required().min(1).max(100),
  model: Joi.string().required().min(1).max(100),
  year: Joi.number().integer().min(1900).max(2030).required(),
  price: Joi.number().positive().required(),
  kilometers: Joi.number().integer().min(0).default(0),
  transmission: Joi.string().valid('manual', 'automatic').required(),
  fuelType: Joi.string().valid('gasoline', 'diesel', 'hybrid', 'electric').required(),
  color: Joi.string().required().min(1).max(50),
  description: Joi.string().required().min(1).max(2000),
  features: Joi.array().items(Joi.string()).default([]),
  condition: Joi.string().valid('new', 'used').required(),
  category: Joi.string().required().min(1).max(100),
  status: Joi.string().valid('available', 'sold', 'reserved').default('available'),
  isActive: Joi.boolean().default(true)
});

const vehicleUpdateSchema = vehicleSchema.fork(Object.keys(vehicleSchema.describe().keys), (schema) => schema.optional());

// Helper function to validate request body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.details.map(detail => detail.message)
      });
    }
    req.body = value;
    next();
  };
};

// Helper function to handle Supabase errors
const handleSupabaseError = (error, res) => {
  console.error('Supabase error:', error);
  return res.status(500).json({
    error: 'שגיאה בשרת',
    message: error.message
  });
};

// Routes

// AI Routes
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST /api/storage/create-bucket - Create storage bucket
app.post('/api/storage/create-bucket', async (req, res) => {
  try {
    const { data, error } = await supabase.storage.createBucket('cars-media', {
      public: true,
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return res.status(500).json({ 
        error: 'שגיאה ביצירת bucket',
        message: error.message 
      });
    }

    res.json({ 
      message: 'Bucket נוצר בהצלחה',
      bucket: data 
    });
  } catch (error) {
    console.error('Error in create-bucket:', error);
    res.status(500).json({ 
      error: 'שגיאה ביצירת bucket',
      message: error.message 
    });
  }
});

// GET /api/vehicles - List all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, brand, model, year, minPrice, maxPrice, status } = req.query;
    
    let query = supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (brand) {
      query = query.eq('brand', brand);
    }
    if (model) {
      query = query.eq('model', model);
    }
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error, res);
    }

    // For now, return vehicles without media to avoid timeout
    // Media can be fetched separately via /api/vehicles/:id/media
    res.json({
      vehicles: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/brands - Get all brands
app.get('/api/vehicles/brands', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('brand')
      .eq('is_active', true);

    if (error) {
      return handleSupabaseError(error, res);
    }

    const brands = [...new Set(data.map(item => item.brand))].sort();
    res.json({ brands });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/models/:brand - Get models for a brand
app.get('/api/vehicles/models/:brand', async (req, res) => {
  try {
    const { brand } = req.params;

    const { data, error } = await supabase
      .from('cars')
      .select('model')
      .eq('brand', brand)
      .eq('is_active', true);

    if (error) {
      return handleSupabaseError(error, res);
    }

    const models = [...new Set(data.map(item => item.model))].sort();
    res.json({ models });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/:id - Get single vehicle
app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'רכב לא נמצא' });
      }
      return handleSupabaseError(error, res);
    }

    res.json({ vehicle: data });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// POST /api/vehicles - Create new vehicle
app.post('/api/vehicles', validateRequest(vehicleSchema), async (req, res) => {
  try {
    const vehicleData = req.body;

    const { data, error } = await supabase
      .from('cars')
      .insert([vehicleData])
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error, res);
    }

    res.status(201).json({ vehicle: data });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// PUT /api/vehicles/:id - Update vehicle
app.put('/api/vehicles/:id', validateRequest(vehicleUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'רכב לא נמצא' });
      }
      return handleSupabaseError(error, res);
    }

    res.json({ vehicle: data });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First, get all media files for this vehicle
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('filename')
      .eq('car_id', id);

    if (mediaError) {
      console.error('Error fetching media files:', mediaError);
    }

    // Delete media files from storage
    if (mediaFiles && mediaFiles.length > 0) {
      const fileNames = mediaFiles.map(file => file.filename);
      const { error: storageError } = await supabase.storage
        .from('cars-media')
        .remove(fileNames);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // Delete media records from database
    await supabase
      .from('media_files')
      .delete()
      .eq('car_id', id);

    // Soft delete the vehicle (set is_active to false)
    const { error } = await supabase
      .from('cars')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return handleSupabaseError(error, res);
    }

    res.json({ 
      message: 'רכב וכל קבצי המדיה שלו נמחקו בהצלחה',
      deletedMediaFiles: mediaFiles ? mediaFiles.length : 0
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// PATCH /api/vehicles/:id/status - Update vehicle status
app.patch('/api/vehicles/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['available', 'sold', 'reserved'].includes(status)) {
      return res.status(400).json({
        error: 'סטטוס לא תקין',
        message: 'סטטוס חייב להיות: available, sold, או reserved'
      });
    }

    const { data, error } = await supabase
      .from('cars')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'רכב לא נמצא' });
      }
      return handleSupabaseError(error, res);
    }

    res.json({ 
      message: 'סטטוס הרכב עודכן בהצלחה',
      vehicle: data 
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/status/:status - Get vehicles by status
app.get('/api/vehicles/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate status
    if (!['available', 'sold', 'reserved'].includes(status)) {
      return res.status(400).json({
        error: 'סטטוס לא תקין',
        message: 'סטטוס חייב להיות: available, sold, או reserved'
      });
    }

    let query = supabase
      .from('cars')
      .select('*')
      .eq('status', status)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error, res);
    }

    res.json({
      vehicles: data,
      status: status,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// POST /api/vehicles/:id/media - Upload media files for a vehicle
app.post('/api/vehicles/:id/media', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        error: 'שגיאה בהעלאת הקובץ',
        message: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    console.log('Media upload request:', { id, file: file ? { name: file.originalname, size: file.size, mimetype: file.mimetype } : null });

    if (!file) {
      console.log('No file uploaded');
      return res.status(400).json({
        error: 'לא הועלה קובץ',
        message: 'יש להעלות קובץ אחד'
      });
    }

    // Check if vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'רכב לא נמצא' });
    }

    try {
      // Convert file to base64 for storage in database
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${id}/${timestamp}_${randomString}.${fileExtension}`;

      // Save media record to database with base64 data
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_files')
        .insert({
          car_id: id,
          filename: fileName,
          original_name: file.originalname,
          size: file.size,
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: dataUrl // Store as data URL instead of public URL
        })
        .select()
        .single();

      if (mediaError) {
        return res.status(500).json({
          error: 'שגיאה בשמירת הקובץ במסד הנתונים',
          message: mediaError.message
        });
      }

      res.json({
        message: 'הקובץ הועלה בהצלחה',
        media: {
          id: mediaData.id,
          filename: mediaData.filename,
          originalName: mediaData.original_name,
          size: mediaData.size,
          type: mediaData.type,
          url: mediaData.url,
          carId: mediaData.car_id,
          createdAt: new Date(mediaData.created_at)
        }
      });
    } catch (fileError) {
      return res.status(500).json({
        error: 'שגיאה בהעלאת הקובץ',
        message: fileError.message
      });
    }
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/:id/media - Get media files for a vehicle
app.get('/api/vehicles/:id/media', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('car_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return handleSupabaseError(error, res);
    }

    res.json({ mediaFiles: data });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// DELETE /api/vehicles/:id/media/:mediaId - Delete a specific media file
app.delete('/api/vehicles/:id/media/:mediaId', async (req, res) => {
  try {
    const { id, mediaId } = req.params;

    // Get media file info
    const { data: mediaFile, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaId)
      .eq('car_id', id)
      .single();

    if (mediaError || !mediaFile) {
      return res.status(404).json({ error: 'קובץ מדיה לא נמצא' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('cars-media')
      .remove([mediaFile.filename]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      return handleSupabaseError(deleteError, res);
    }

    res.json({ message: 'קובץ מדיה נמחק בהצלחה' });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// POST /api/vehicles/import - Import vehicles from Excel file
app.post('/api/vehicles/import', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'לא הועלה קובץ',
        message: 'יש להעלות קובץ Excel (.xlsx)'
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'סוג קובץ לא נתמך',
        message: 'יש להעלות קובץ Excel (.xlsx או .xls)'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        error: 'קובץ ריק',
        message: 'הקובץ Excel אינו מכיל נתונים'
      });
    }

    const results = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Map Excel columns to our schema
        const vehicleData = {
          name: row['שם הרכב'] || row['Vehicle Name'] || row['name'],
          brand: row['מותג'] || row['Brand'] || row['brand'],
          model: row['דגם'] || row['Model'] || row['model'],
          year: parseInt(row['שנה'] || row['Year'] || row['year']),
          price: parseFloat(row['מחיר'] || row['Price'] || row['price']),
          kilometers: parseInt(row['קילומטרים'] || row['Kilometers'] || row['kilometers'] || 0),
          transmission: row['תיבת הילוכים'] || row['Transmission'] || row['transmission'],
          fuelType: row['סוג דלק'] || row['Fuel Type'] || row['fuelType'],
          color: row['צבע'] || row['Color'] || row['color'],
          description: row['תיאור'] || row['Description'] || row['description'],
          features: row['תכונות'] || row['Features'] || row['features'] || [],
          condition: row['מצב'] || row['Condition'] || row['condition'],
          category: row['קטגוריה'] || row['Category'] || row['category'],
          status: row['סטטוס'] || row['Status'] || row['status'] || 'available',
          isActive: true
        };

        // Validate the data
        const { error: validationError } = vehicleSchema.validate(vehicleData);
        if (validationError) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: validationError.details[0].message,
            data: vehicleData
          });
          continue;
        }

        // Check if vehicle already exists (by name and brand)
        const { data: existingVehicle } = await supabase
          .from('cars')
          .select('id')
          .eq('name', vehicleData.name)
          .eq('brand', vehicleData.brand)
          .eq('is_active', true)
          .single();

        if (existingVehicle) {
          // Update existing vehicle
          const { error: updateError } = await supabase
            .from('cars')
            .update(vehicleData)
            .eq('id', existingVehicle.id);

          if (updateError) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: `שגיאה בעדכון רכב קיים: ${updateError.message}`,
              data: vehicleData
            });
          } else {
            results.success++;
          }
        } else {
          // Insert new vehicle
          const { error: insertError } = await supabase
            .from('cars')
            .insert(vehicleData);

          if (insertError) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: `שגיאה ביצירת רכב חדש: ${insertError.message}`,
              data: vehicleData
            });
          } else {
            results.success++;
          }
        }
      } catch (rowError) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: `שגיאה בעיבוד שורה: ${rowError.message}`,
          data: row
        });
      }
    }

    res.json({
      message: `ייבוא הושלם: ${results.success} הצליחו, ${results.failed} נכשלו`,
      results
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/vehicles/export - Export vehicles to Excel file
app.get('/api/vehicles/export', async (req, res) => {
  try {
    const { status, brand, category } = req.query;

    // Build query
    let query = supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (brand) {
      query = query.eq('brand', brand);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: vehicles, error } = await query;

    if (error) {
      return handleSupabaseError(error, res);
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('רכבים');

    // Define columns
    worksheet.columns = [
      { header: 'שם הרכב', key: 'name', width: 20 },
      { header: 'מותג', key: 'brand', width: 15 },
      { header: 'דגם', key: 'model', width: 15 },
      { header: 'שנה', key: 'year', width: 8 },
      { header: 'מחיר', key: 'price', width: 12 },
      { header: 'קילומטרים', key: 'kilometers', width: 12 },
      { header: 'תיבת הילוכים', key: 'transmission', width: 15 },
      { header: 'סוג דלק', key: 'fuelType', width: 12 },
      { header: 'צבע', key: 'color', width: 12 },
      { header: 'תיאור', key: 'description', width: 30 },
      { header: 'תכונות', key: 'features', width: 20 },
      { header: 'מצב', key: 'condition', width: 10 },
      { header: 'קטגוריה', key: 'category', width: 15 },
      { header: 'סטטוס', key: 'status', width: 12 },
      { header: 'תאריך יצירה', key: 'created_at', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    vehicles.forEach(vehicle => {
      const row = worksheet.addRow({
        name: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        kilometers: vehicle.kilometers,
        transmission: vehicle.transmission === 'manual' ? 'ידני' : 'אוטומטי',
        fuelType: vehicle.fuelType === 'gasoline' ? 'בנזין' : 
                 vehicle.fuelType === 'diesel' ? 'דיזל' :
                 vehicle.fuelType === 'hybrid' ? 'היברידי' : 'חשמלי',
        color: vehicle.color,
        description: vehicle.description,
        features: Array.isArray(vehicle.features) ? vehicle.features.join(', ') : vehicle.features,
        condition: vehicle.condition === 'new' ? 'חדש' : 'משומש',
        category: vehicle.category,
        status: vehicle.status === 'available' ? 'זמין' :
                vehicle.status === 'sold' ? 'נמכר' : 'שמור',
        created_at: new Date(vehicle.created_at).toLocaleDateString('he-IL')
      });

      // Alternate row colors
      if (row.number % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F8F8' }
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width, 10);
    });

    // Set response headers
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `vehicles_export_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// ========================================
// LEADS API ENDPOINTS
// ========================================

// Validation schemas for leads
const createLeadSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().min(10).max(20).required(),
  whatsapp: Joi.string().min(10).max(20).optional(),
  source: Joi.string().valid('website', 'whatsapp', 'phone', 'email', 'social', 'referral').default('website'),
  interest_in_car: Joi.string().uuid().optional(),
  budget: Joi.number().positive().optional(),
  timeline: Joi.string().valid('immediate', '1-3_months', '3-6_months', '6+_months').optional(),
  notes: Joi.string().max(1000).optional()
});

const updateLeadStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost').required()
});

const createCommunicationSchema = Joi.object({
  type: Joi.string().valid('email', 'whatsapp', 'phone', 'note').required(),
  direction: Joi.string().valid('inbound', 'outbound').required(),
  content: Joi.string().min(1).max(2000).required(),
  subject: Joi.string().max(255).optional()
});

// POST /api/leads - Create new lead (public endpoint)
app.post('/api/leads', async (req, res) => {
  try {
    const { error, value } = createLeadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.details[0].message
      });
    }

    const { data, error: insertError } = await supabase
      .from('leads')
      .insert([value])
      .select()
      .single();

    if (insertError) {
      return handleSupabaseError(insertError, res);
    }

    res.status(201).json({
      message: 'ליד נוצר בהצלחה',
      lead: data
    });

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/leads - Get all leads (authenticated users only)
app.get('/api/leads', async (req, res) => {
  try {
    const { status, priority, source, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        interest_in_car:cars(id, name, brand, model, price)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (source) {
      query = query.eq('source', source);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return handleSupabaseError(error, res);
    }

    res.json({
      leads: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/leads/:id - Get single lead with communications
app.get('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        interest_in_car:cars(id, name, brand, model, price)
      `)
      .eq('id', id)
      .single();

    if (leadError) {
      return handleSupabaseError(leadError, res);
    }

    // Get communications
    const { data: communications, error: commError } = await supabase
      .from('lead_communications')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (commError) {
      return handleSupabaseError(commError, res);
    }

    res.json({
      lead,
      communications
    });

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// PATCH /api/leads/:id - Update lead status
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateLeadStatusSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.details[0].message
      });
    }

    const { data, error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: value.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return handleSupabaseError(updateError, res);
    }

    res.json({
      message: 'סטטוס הליד עודכן בהצלחה',
      lead: data
    });

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// POST /api/leads/:id/communications - Add communication log
app.post('/api/leads/:id/communications', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = createCommunicationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.details[0].message
      });
    }

    const communicationData = {
      lead_id: id,
      ...value,
      status: 'sent'
    };

    const { data, error: insertError } = await supabase
      .from('lead_communications')
      .insert([communicationData])
      .select()
      .single();

    if (insertError) {
      return handleSupabaseError(insertError, res);
    }

    res.status(201).json({
      message: 'תקשורת נוספה בהצלחה',
      communication: data
    });

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/leads/stats - Get leads statistics
app.get('/api/leads/stats', async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, priority, source, created_at');

    if (error) {
      return handleSupabaseError(error, res);
    }

    // Calculate statistics
    const stats = {
      total: leads.length,
      byStatus: {},
      byPriority: {},
      bySource: {},
      thisMonth: 0,
      thisWeek: 0
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    leads.forEach(lead => {
      // Status stats
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
      
      // Priority stats
      stats.byPriority[lead.priority] = (stats.byPriority[lead.priority] || 0) + 1;
      
      // Source stats
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;
      
      // Time-based stats
      const createdDate = new Date(lead.created_at);
      if (createdDate >= thisMonth) {
        stats.thisMonth++;
      }
      if (createdDate >= thisWeek) {
        stats.thisWeek++;
      }
    });

    res.json(stats);

  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// ========================================
// SETTINGS API ENDPOINTS
// ========================================

// Validation schemas for settings
const settingsSchema = Joi.object({
  siteTitle: Joi.string().min(1).max(255).required(),
  contactEmail: Joi.string().email().required(),
  whatsappPhone: Joi.string().min(10).max(20).required(),
  maintenanceMode: Joi.boolean().default(false),
  aboutPage: Joi.string().max(10000).allow(''),
  termsPage: Joi.string().max(10000).allow(''),
  whatsappTemplate: Joi.string().max(1000).required()
});

// GET /api/settings - Get system settings
app.get('/api/settings', async (req, res) => {
  try {
    // TODO: Replace with actual database query
    // For now, return default settings
    const defaultSettings = {
      siteTitle: 'Strong Luxury Cars',
      contactEmail: 'info@strongluxurycars.com',
      whatsappPhone: '972505666620',
      maintenanceMode: false,
      aboutPage: '',
      termsPage: '',
      whatsappTemplate: 'שלום! אני מעוניין בפרטים על הרכב: {carName}'
    };

    res.json(defaultSettings);
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// PUT /api/settings - Update system settings
app.put('/api/settings', async (req, res) => {
  try {
    const { error, value } = settingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'נתונים לא תקינים',
        details: error.details[0].message
      });
    }

    // TODO: Replace with actual database update
    // For now, just return success
    console.log('Settings updated:', value);

    res.json({
      message: 'ההגדרות עודכנו בהצלחה',
      settings: value
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// GET /api/settings/pages/:page - Get specific page content
app.get('/api/settings/pages/:page', async (req, res) => {
  try {
    const { page } = req.params;
    
    if (!['about', 'terms'].includes(page)) {
      return res.status(400).json({
        error: 'עמוד לא תקין',
        message: 'עמוד חייב להיות: about או terms'
      });
    }

    // TODO: Replace with actual database query
    const pageContent = {
      about: '',
      terms: ''
    };

    res.json({
      page: page,
      content: pageContent[page] || ''
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// PUT /api/settings/pages/:page - Update specific page content
app.put('/api/settings/pages/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const { content } = req.body;
    
    if (!['about', 'terms'].includes(page)) {
      return res.status(400).json({
        error: 'עמוד לא תקין',
        message: 'עמוד חייב להיות: about או terms'
      });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({
        error: 'תוכן לא תקין',
        message: 'תוכן חייב להיות מחרוזת'
      });
    }

    // TODO: Replace with actual database update
    console.log(`Page ${page} updated with content:`, content);

    res.json({
      message: `עמוד ${page} עודכן בהצלחה`,
      page: page,
      content: content
    });
  } catch (error) {
    handleSupabaseError(error, res);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'שגיאה פנימית בשרת',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint לא נמצא' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/health - Health check');
  console.log('- POST /api/ai/chat - AI Chat endpoint');
  console.log('- GET /api/ai/providers - Available AI providers');
  console.log('- GET /api/ai/health - AI services health check');
  console.log('- GET /api/ai/analytics/sales - Sales analytics');
  console.log('- GET /api/ai/analytics/leads - Leads analytics');
  console.log('- GET /api/ai/analytics/inventory - Inventory analytics');
  console.log('- GET /api/ai/analytics/performance - Performance analytics');
  console.log('- GET /api/ai/usage - User usage statistics');
  console.log('- GET /api/ai/costs - Cost summary');
  console.log('- GET /api/ai/performance - Performance statistics');
  console.log('- GET /api/vehicles - List vehicles');
  console.log('- GET /api/vehicles/:id - Get single vehicle');
  console.log('- POST /api/vehicles - Create vehicle');
  console.log('- PUT /api/vehicles/:id - Update vehicle');
  console.log('- DELETE /api/vehicles/:id - Delete vehicle');
  console.log('- GET /api/vehicles/brands - Get all brands');
  console.log('- GET /api/vehicles/models/:brand - Get models for brand');
  console.log('- PATCH /api/vehicles/:id/status - Update vehicle status');
  console.log('- GET /api/vehicles/status/:status - Get vehicles by status');
  console.log('- POST /api/vehicles/:id/media - Upload media files');
  console.log('- GET /api/vehicles/:id/media - Get media files');
  console.log('- DELETE /api/vehicles/:id/media/:mediaId - Delete media file');
  console.log('- POST /api/vehicles/import - Import vehicles from Excel');
  console.log('- GET /api/vehicles/export - Export vehicles to Excel');
  console.log('- POST /api/leads - Create new lead');
  console.log('- GET /api/leads - List all leads');
  console.log('- GET /api/leads/:id - Get single lead');
  console.log('- PATCH /api/leads/:id - Update lead status');
  console.log('- POST /api/leads/:id/communications - Add communication log');
  console.log('- GET /api/leads/stats - Get leads statistics');
  console.log('- GET /api/settings - Get system settings');
  console.log('- PUT /api/settings - Update system settings');
  console.log('- GET /api/settings/pages/:page - Get page content');
  console.log('- PUT /api/settings/pages/:page - Update page content');
});

module.exports = app;
