export interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kilometers: number;
  mileage: number; // שדה נוסף לתאימות
  transmission: 'manual' | 'automatic';
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  color: string;
  description: string;
  features: string[];
  images: string[];
  video?: string;
  condition: 'new' | 'used'; // שדה נוסף
  category: string; // שדה נוסף
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'content_manager' | 'sales_rep';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: 'image' | 'video';
  url: string;
  optimizedUrl?: string;
  carId?: string;
  createdAt: Date;
  file?: File; // Temporary field for file upload
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  source: 'website' | 'whatsapp' | 'phone' | 'email' | 'social' | 'referral';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  interestInCar?: string; // Car ID
  budget?: number;
  timeline?: 'immediate' | '1-3_months' | '3-6_months' | '6+_months';
  notes?: string;
  assignedTo?: string; // User ID
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadCommunication {
  id: string;
  leadId: string;
  type: 'email' | 'whatsapp' | 'phone' | 'note';
  direction: 'inbound' | 'outbound';
  content: string;
  subject?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    messageId?: string;
    timestamp?: Date;
    attachments?: string[];
  };
  createdAt: Date;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'greeting' | 'follow_up' | 'car_info' | 'pricing' | 'appointment' | 'closing';
  content: string;
  variables: string[]; // e.g., ['firstName', 'carName', 'price']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppSession {
  id: string;
  userId: string;
  qrCode?: string;
  isConnected: boolean;
  lastActivity: Date;
  createdAt: Date;
}