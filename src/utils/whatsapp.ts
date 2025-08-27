import { supabase } from './supabase';
import { Lead, LeadCommunication, WhatsAppTemplate } from '../types';

// WhatsApp Web.js types (simplified for now)
interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
}

interface WhatsAppClient {
  isConnected: boolean;
  sendMessage: (to: string, message: string) => Promise<void>;
  onMessage: (callback: (message: WhatsAppMessage) => void) => void;
  onQRCode: (callback: (qr: string) => void) => void;
  onReady: (callback: () => void) => void;
  onDisconnected: (callback: () => void) => void;
}

// Mock WhatsApp client for development
class MockWhatsAppClient implements WhatsAppClient {
  isConnected = false;
  private messageCallbacks: ((message: WhatsAppMessage) => void)[] = [];
  private qrCallbacks: ((qr: string) => void)[] = [];
  private readyCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];

  async connect(): Promise<void> {
    // Simulate connection process
    this.isConnected = false;
    
    // Generate mock QR code
    const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Emit QR code
    this.qrCallbacks.forEach(callback => callback(mockQR));
    
    // Simulate connection after 3 seconds
    setTimeout(() => {
      this.isConnected = true;
      this.readyCallbacks.forEach(callback => callback());
    }, 3000);
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WhatsApp client not connected');
    }

    // Simulate message sending
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate incoming response (for testing)
    setTimeout(() => {
      const mockResponse: WhatsAppMessage = {
        id: `msg_${Date.now()}`,
        from: to,
        to: '972501234567',
        body: 'תודה על המידע! אחזור אליך בקרוב.',
        timestamp: new Date(),
        type: 'text'
      };
      
      this.messageCallbacks.forEach(callback => callback(mockResponse));
    }, 2000);
  }

  onMessage(callback: (message: WhatsAppMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onQRCode(callback: (qr: string) => void): void {
    this.qrCallbacks.push(callback);
  }

  onReady(callback: () => void): void {
    this.readyCallbacks.push(callback);
  }

  onDisconnected(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  disconnect(): void {
    this.isConnected = false;
    this.disconnectCallbacks.forEach(callback => callback());
  }
}

// Global WhatsApp client instance
let whatsappClient: WhatsAppClient | null = null;

// Initialize WhatsApp client
export const initializeWhatsApp = async (): Promise<WhatsAppClient> => {
  if (whatsappClient) {
    return whatsappClient;
  }

  // For now, use mock client
  // In production, this would initialize the real whatsapp-web.js client
  whatsappClient = new MockWhatsAppClient();
  
  // Set up message handling
  whatsappClient.onMessage(async (message) => {
    await handleIncomingMessage(message);
  });

  return whatsappClient;
};

// Handle incoming WhatsApp messages
const handleIncomingMessage = async (message: WhatsAppMessage): Promise<void> => {
  try {
    // Check if this is a new lead or existing lead
    const existingLead = await findLeadByPhone(message.from);
    
    if (existingLead) {
      // Add communication record for existing lead
      await addCommunicationRecord(existingLead.id, {
        type: 'whatsapp',
        direction: 'inbound',
        content: message.body,
        status: 'delivered'
      });

      // Update last contact date
      await updateLeadLastContact(existingLead.id);
    } else {
      // Create new lead from WhatsApp message
      const newLead = await createLeadFromWhatsApp(message);
      
      // Add communication record
      await addCommunicationRecord(newLead.id, {
        type: 'whatsapp',
        direction: 'inbound',
        content: message.body,
        status: 'delivered'
      });

      // Send welcome message
      await sendWelcomeMessage(newLead);
    }
  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error);
  }
};

// Find lead by phone number
const findLeadByPhone = async (phone: string): Promise<Lead | null> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`phone.eq.${phone},whatsapp.eq.${phone}`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error finding lead by phone:', error);
    return null;
  }
};

// Create new lead from WhatsApp message
const createLeadFromWhatsApp = async (message: WhatsAppMessage): Promise<Lead> => {
  try {
    // Extract name from message if possible
    const nameMatch = message.body.match(/^שלום, אני (.+)/);
    const firstName = nameMatch ? nameMatch[1].split(' ')[0] : 'לקוח';
    const lastName = nameMatch ? nameMatch[1].split(' ').slice(1).join(' ') : 'חדש';

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}@example.com`, // Placeholder
        phone: message.from,
        whatsapp: message.from,
        source: 'whatsapp',
        status: 'new',
        priority: 'medium'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating lead from WhatsApp:', error);
    throw error;
  }
};

// Add communication record
const addCommunicationRecord = async (
  leadId: string, 
  communication: Partial<LeadCommunication>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lead_communications')
      .insert([{
        lead_id: leadId,
        ...communication
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding communication record:', error);
    throw error;
  }
};

// Update lead's last contact date
const updateLeadLastContact = async (leadId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating lead last contact:', error);
  }
};

// Send welcome message to new lead
const sendWelcomeMessage = async (lead: Lead): Promise<void> => {
  try {
    const template = await getWhatsAppTemplate('greeting');
    if (!template) return;

    const message = replaceTemplateVariables(template.content, {
      firstName: lead.firstName
    });

    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    // Add communication record
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
};

// Get WhatsApp template by category
const getWhatsAppTemplate = async (category: string): Promise<WhatsAppTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting WhatsApp template:', error);
    return null;
  }
};

// Replace template variables
const replaceTemplateVariables = (content: string, variables: Record<string, string>): string => {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

// Send WhatsApp message
export const sendWhatsAppMessage = async (to: string, message: string): Promise<void> => {
  if (!whatsappClient) {
    throw new Error('WhatsApp client not initialized');
  }

  if (!whatsappClient.isConnected) {
    throw new Error('WhatsApp client not connected');
  }

  await whatsappClient.sendMessage(to, message);
};

// Send car information message
export const sendCarInfoMessage = async (lead: Lead, car: any): Promise<void> => {
  try {
    const template = await getWhatsAppTemplate('car_info');
    if (!template) return;

    const message = replaceTemplateVariables(template.content, {
      firstName: lead.firstName,
      carName: car.name,
      price: new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0
      }).format(car.price),
      year: car.year.toString(),
      kilometers: car.kilometers?.toLocaleString('he-IL') || '0'
    });

    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    // Add communication record
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending car info message:', error);
    throw error;
  }
};

// Send follow-up message
export const sendFollowUpMessage = async (lead: Lead): Promise<void> => {
  try {
    const template = await getWhatsAppTemplate('follow_up');
    if (!template) return;

    const message = replaceTemplateVariables(template.content, {
      firstName: lead.firstName
    });

    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    // Add communication record
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  } catch (error) {
    console.error('Error sending follow-up message:', error);
    throw error;
  }
};

// Get WhatsApp connection status
export const getWhatsAppStatus = (): { isConnected: boolean; client: WhatsAppClient | null } => {
  return {
    isConnected: whatsappClient?.isConnected || false,
    client: whatsappClient
  };
};

// Disconnect WhatsApp client
export const disconnectWhatsApp = (): void => {
  if (whatsappClient) {
    whatsappClient.disconnect();
    whatsappClient = null;
  }
};

// Get QR code for connection
export const getQRCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!whatsappClient) {
      reject(new Error('WhatsApp client not initialized'));
      return;
    }

    whatsappClient.onQRCode((qr) => {
      resolve(qr);
    });

    // Initialize connection if not already connected
    if (!whatsappClient.isConnected) {
      whatsappClient.connect().catch(reject);
    }
  });
};
