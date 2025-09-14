import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  color: string;
  images: string[];
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// פונקציה לקבלת הרכב הזול ביותר במלאי
export const getCheapestCarPrice = async (): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('price')
      .eq('status', 'available')
      .order('price', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching cheapest car:', error);
      return null;
    }

    return data?.price || null;
  } catch (error) {
    console.error('Error in getCheapestCarPrice:', error);
    return null;
  }
};

// פונקציה לקבלת הרכב הזול ביותר עם פרטים מלאים
export const getCheapestCar = async (): Promise<Car | null> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('status', 'available')
      .order('price', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching cheapest car:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCheapestCar:', error);
    return null;
  }
};

// Hook React לקבלת מחיר הרכב הזול ביותר
export const useCheapestCarPrice = () => {
  const [cheapestPrice, setCheapestPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheapestPrice = async () => {
      setLoading(true);
      const price = await getCheapestCarPrice();
      setCheapestPrice(price);
      setLoading(false);
    };

    fetchCheapestPrice();
    
    // רענון כל 5 דקות
    const interval = setInterval(fetchCheapestPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { cheapestPrice, loading };
};

// Hook React לקבלת הרכב הזול ביותר עם פרטים מלאים
export const useCheapestCar = () => {
  const [cheapestCar, setCheapestCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheapestCar = async () => {
      setLoading(true);
      const car = await getCheapestCar();
      setCheapestCar(car);
      setLoading(false);
    };

    fetchCheapestCar();
    
    // רענון כל 5 דקות
    const interval = setInterval(fetchCheapestCar, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { cheapestCar, loading };
};
