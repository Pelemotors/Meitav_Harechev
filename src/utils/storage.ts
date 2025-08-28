import { supabase } from './supabase';
import { Car, MediaFile } from '../types';

// Empty array for fallback when no data is available
const mockCars: Car[] = [];

// Upload media file directly to Supabase
export const uploadMediaFile = async (file: File, carId: string): Promise<MediaFile> => {
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('הקובץ גדול מדי. מקסימום 5MB');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('סוג קובץ לא נתמך. רק תמונות ווידאו');
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

    return {
      ...mediaData,
      carId: mediaData.car_id,
      createdAt: new Date(mediaData.created_at)
    };
  } catch (error) {
    console.error('Error in uploadMediaFile:', error);
    throw error;
  }
};

// Get all media files for a car
export const getCarMedia = async (carId: string): Promise<MediaFile[]> => {
  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching car media:', error);
      throw error;
    }

    return (data || []).map(media => ({
      ...media,
      carId: media.car_id,
      createdAt: new Date(media.created_at)
    }));
  } catch (error) {
    console.error('Error in getCarMedia:', error);
    throw error;
  }
};

// Delete media file from Storage and DB
export const deleteMediaFile = async (mediaId: string): Promise<boolean> => {
  try {
    // Get media record first
    const { data: media, error: fetchError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaId)
      .single();

    if (fetchError) {
      console.error('Error fetching media for deletion:', fetchError);
      return false;
    }

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('cars-media')
      .remove([media.filename]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue anyway to delete from DB
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaId);

    if (dbError) {
      console.error('Error deleting from DB:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMediaFile:', error);
    return false;
  }
};

// Get cars with their media files
export const getCarsWithMedia = async (): Promise<Car[]> => {
  try {
    // Get all cars
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (carsError) {
      console.error('Error fetching cars:', carsError);
      return mockCars;
    }

    // Get all media files
    const { data: mediaFiles, error: mediaError } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaError) {
      console.error('Error fetching media files:', mediaError);
      // Continue without media
    }

    // Group media files by carId
    const mediaByCarId = (mediaFiles || []).reduce((acc, media: any) => {
      if (media.car_id) {
        if (!acc[media.car_id]) {
          acc[media.car_id] = [];
        }
        acc[media.car_id].push(media);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Transform cars and add media
    return (cars || []).map(car => {
      const carMedia = mediaByCarId[car.id] || [];
      const images = carMedia
        .filter((media: any) => media.type === 'image')
        .map((media: any) => media.url);
      const video = carMedia
        .filter((media: any) => media.type === 'video')
        .map((media: any) => media.url)[0];

      return {
        ...car,
        fuelType: car.fuel_type,
        isActive: car.is_active,
        images: images.length > 0 ? images : car.images || [], // Fallback to existing images
        video: video || car.video,
        createdAt: new Date(car.created_at),
        updatedAt: new Date(car.updated_at)
      };
    });
  } catch (error) {
    console.error('Error in getCarsWithMedia:', error);
    return mockCars;
  }
};

export const getCars = async (): Promise<Car[]> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
      return mockCars;
    }

    // Transform data to match our interface
    return (data || []).map(car => ({
      ...car,
      fuelType: car.fuel_type,
      isActive: car.is_active,
      createdAt: new Date(car.created_at),
      updatedAt: new Date(car.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching cars:', error);
    return mockCars;
  }
};

export const saveCar = async (car: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> => {
  try {
    // Generate name automatically from brand, model, and year
    const carName = `${car.brand} ${car.model} ${car.year}`;
    
    // Extract only the fields that exist in the database table
    const carData = {
      name: carName,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      kilometers: car.kilometers,
      transmission: car.transmission,
      fuel_type: car.fuelType,
      color: car.color,
      description: car.description,
      features: car.features,
      is_active: car.isActive
    };

    const { data, error } = await supabase
      .from('cars')
      .insert([carData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Save media files if provided
    if (car.images && car.images.length > 0) {
      await saveCarMedia(data.id, car.images, 'image');
    }

    if (car.video) {
      await saveCarMedia(data.id, [car.video], 'video');
    }

    return {
      ...data,
      fuelType: data.fuel_type,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error saving car:', error);
    throw error;
  }
};

export const updateCar = async (id: string, updates: Partial<Car>): Promise<Car | null> => {
  try {
    // Map the updates to database column names
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.kilometers !== undefined) updateData.kilometers = updates.kilometers;
    if (updates.transmission !== undefined) updateData.transmission = updates.transmission;
    if (updates.fuelType !== undefined) updateData.fuel_type = updates.fuelType;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.features !== undefined) updateData.features = updates.features;
    // Note: images and video are handled separately in media_files table
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating car:', error);
      return null;
    }

    return {
      ...data,
      fuelType: data.fuel_type,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error updating car:', error);
    return null;
  }
};

// Media handling functions
export const saveCarMedia = async (carId: string, mediaUrls: string[], type: 'image' | 'video'): Promise<void> => {
  try {
    for (const url of mediaUrls) {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        // This is a temporary URL, skip for now
        // In a real implementation, you would upload the file to Supabase Storage
        continue;
      }

      const mediaData = {
        filename: url.split('/').pop() || 'media',
        original_name: url.split('/').pop() || 'media',
        size: 0, // Will be updated when file is actually uploaded
        type: type,
        url: url,
        car_id: carId
      };

      await supabase
        .from('media_files')
        .insert([mediaData]);
    }
  } catch (error) {
    console.error('Error saving car media:', error);
  }
};

// Upload file to Supabase Storage
export const uploadFileToStorage = async (file: File, carId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${carId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('cars-media')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cars-media')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
};



export const deleteCarMedia = async (mediaId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
};

export const deleteCar = async (id: string): Promise<boolean> => {
  try {
    // First delete all media files for this car
    const mediaFiles = await getCarMedia(id);
    for (const media of mediaFiles) {
      await deleteMediaFile(media.id);
    }

    // Then delete the car
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting car:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting car:', error);
    return false;
  }
};