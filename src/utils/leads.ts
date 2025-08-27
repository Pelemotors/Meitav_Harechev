import { supabase } from './supabase';
import { Lead, LeadCommunication } from '../types';
import { sendWhatsAppMessage, sendCarInfoMessage, sendFollowUpMessage } from './whatsapp';

// Create new lead with automatic notifications
export const createLead = async (leadData: Partial<Lead>): Promise<Lead> => {
  try {
    // Insert lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;

    // Send welcome notification based on source
    await sendWelcomeNotification(lead);

    // Send notification to assigned user (if any)
    if (lead.assignedTo) {
      await notifyAssignedUser(lead);
    }

    return lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

// Send welcome notification based on lead source
const sendWelcomeNotification = async (lead: Lead): Promise<void> => {
  try {
    switch (lead.source) {
      case 'whatsapp':
        await sendWhatsAppWelcomeMessage(lead);
        break;
      case 'website':
        await sendWebsiteWelcomeMessage(lead);
        break;
      case 'phone':
        await sendPhoneWelcomeMessage(lead);
        break;
      case 'email':
        await sendEmailWelcomeMessage(lead);
        break;
      default:
        await sendGenericWelcomeMessage(lead);
    }
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
};

// Send WhatsApp welcome message
const sendWhatsAppWelcomeMessage = async (lead: Lead): Promise<void> => {
  if (!lead.whatsapp && !lead.phone) return;

  const message = `שלום ${lead.firstName}! 

תודה על פנייתך ל-Strong Luxury Cars 🚗

נציגנו יצור איתך קשר בהקדם האפשרי עם פרטים על הרכבים המתאימים לך.

בינתיים, תוכל לצפות במלאי הרכבים שלנו באתר:
https://strongluxurycars.com

לשאלות דחופות: 050-1234567

בברכה,
צוות Strong Luxury Cars`;

  await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
  
  // Add communication record
  await addCommunicationRecord(lead.id, {
    type: 'whatsapp',
    direction: 'outbound',
    content: message,
    status: 'sent'
  });
};

// Send website welcome message (email)
const sendWebsiteWelcomeMessage = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName},

תודה על פנייתך ל-Strong Luxury Cars!

קיבלנו את פנייתך ונציגנו יצור איתך קשר בהקדם האפשרי.

פרטי הפנייה שלך:
שם: ${lead.firstName} ${lead.lastName}
טלפון: ${lead.phone}
${lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : ''}
${lead.budget ? `תקציב: ${new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(lead.budget)}` : ''}

לשאלות דחופות: 050-1234567

בברכה,
צוות Strong Luxury Cars`;

  // TODO: Implement email sending
  console.log('Sending email:', message);
  
  // Add communication record
  await addCommunicationRecord(lead.id, {
    type: 'email',
    direction: 'outbound',
    content: message,
    subject: 'תודה על פנייתך - Strong Luxury Cars',
    status: 'sent'
  });
};

// Send phone welcome message (SMS)
const sendPhoneWelcomeMessage = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName}! תודה על פנייתך ל-Strong Luxury Cars. נציגנו יצור איתך קשר בהקדם. לשאלות: 050-1234567`;

  // TODO: Implement SMS sending
  console.log('Sending SMS:', message);
  
  // Add communication record
  await addCommunicationRecord(lead.id, {
    type: 'phone',
    direction: 'outbound',
    content: message,
    status: 'sent'
  });
};

// Send email welcome message
const sendEmailWelcomeMessage = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName},

תודה על פנייתך ל-Strong Luxury Cars!

קיבלנו את פנייתך ונציגנו יצור איתך קשר בהקדם האפשרי.

פרטי הפנייה שלך:
שם: ${lead.firstName} ${lead.lastName}
טלפון: ${lead.phone}
${lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : ''}

לשאלות דחופות: 050-1234567

בברכה,
צוות Strong Luxury Cars`;

  // TODO: Implement email sending
  console.log('Sending email:', message);
  
  // Add communication record
  await addCommunicationRecord(lead.id, {
    type: 'email',
    direction: 'outbound',
    content: message,
    subject: 'תודה על פנייתך - Strong Luxury Cars',
    status: 'sent'
  });
};

// Send generic welcome message
const sendGenericWelcomeMessage = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName}! תודה על פנייתך ל-Strong Luxury Cars. נציגנו יצור איתך קשר בהקדם. לשאלות: 050-1234567`;

  // Try WhatsApp first, then phone
  if (lead.whatsapp || lead.phone) {
    try {
      await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
      
      await addCommunicationRecord(lead.id, {
        type: 'whatsapp',
        direction: 'outbound',
        content: message,
        status: 'sent'
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  }
};

// Notify assigned user about new lead
const notifyAssignedUser = async (lead: Lead): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', lead.assignedTo)
      .single();

    if (error || !user) return;

    const message = `ליד חדש הוקצה אליך:

שם: ${lead.firstName} ${lead.lastName}
טלפון: ${lead.phone}
${lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : ''}
מקור: ${getSourceText(lead.source)}
${lead.budget ? `תקציב: ${new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(lead.budget)}` : ''}

נא ליצור קשר בהקדם האפשרי.`;

    // TODO: Send notification to user (email, SMS, or internal notification)
    console.log('Notifying user:', user.username, message);
  } catch (error) {
    console.error('Error notifying assigned user:', error);
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
  }
};

// Get source text
const getSourceText = (source: string): string => {
  const sourceMap: { [key: string]: string } = {
    'website': 'אתר',
    'whatsapp': 'WhatsApp',
    'phone': 'טלפון',
    'email': 'אימייל',
    'social': 'רשתות חברתיות',
    'referral': 'המלצה'
  };
  return sourceMap[source] || source;
};

// Update lead status with automatic notifications
export const updateLeadStatus = async (
  leadId: string, 
  newStatus: string, 
  notes?: string
): Promise<void> => {
  try {
    // Get lead data
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;

    // Update status
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: newStatus,
        last_contact_date: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) throw updateError;

    // Send status-specific notifications
    await sendStatusNotification(lead, newStatus, notes);
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

// Send status-specific notifications
const sendStatusNotification = async (
  lead: Lead, 
  status: string, 
  notes?: string
): Promise<void> => {
  try {
    switch (status) {
      case 'contacted':
        await sendContactedNotification(lead);
        break;
      case 'qualified':
        await sendQualifiedNotification(lead);
        break;
      case 'proposal':
        await sendProposalNotification(lead);
        break;
      case 'closed':
        await sendClosedNotification(lead);
        break;
      case 'lost':
        await sendLostNotification(lead);
        break;
    }

    // Add note if provided
    if (notes) {
      await addCommunicationRecord(lead.id, {
        type: 'note',
        direction: 'outbound',
        content: notes,
        status: 'sent'
      });
    }
  } catch (error) {
    console.error('Error sending status notification:', error);
  }
};

// Send contacted notification
const sendContactedNotification = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName}!

יצרנו איתך קשר כפי שהבטחנו.

האם יש לך שאלות נוספות או תרצה לקבוע פגישה לצפייה ברכבים?

לשאלות: 050-1234567

בברכה,
צוות Strong Luxury Cars`;

  if (lead.whatsapp || lead.phone) {
    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  }
};

// Send qualified notification
const sendQualifiedNotification = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName}!

שמחנו לשמוע שאתה מתאים לרכב שלנו!

נציגנו יצור איתך קשר בקרוב עם הצעה מפורטת ותנאי מימון.

בינתיים, תוכל לצפות במלאי הרכבים שלנו באתר.

בברכה,
צוות Strong Luxury Cars`;

  if (lead.whatsapp || lead.phone) {
    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  }
};

// Send proposal notification
const sendProposalNotification = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName}!

הנה הצעתנו המיוחדת עבורך!

נציגנו יצור איתך קשר בקרוב עם פרטי ההצעה ותנאי המימון.

ההצעה תקפה ל-7 ימים בלבד!

בברכה,
צוות Strong Luxury Cars`;

  if (lead.whatsapp || lead.phone) {
    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  }
};

// Send closed notification
const sendClosedNotification = async (lead: Lead): Promise<void> => {
  const message = `מזל טוב ${lead.firstName}! 🎉

שמחים על הרכישה!

נציגנו יצור איתך קשר בקרוב לפרטי הגמר והמסירה.

תודה שבחרת ב-Strong Luxury Cars!

בברכה,
צוות Strong Luxury Cars`;

  if (lead.whatsapp || lead.phone) {
    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  }
};

// Send lost notification
const sendLostNotification = async (lead: Lead): Promise<void> => {
  const message = `שלום ${lead.firstName},

תודה על התעניינותך ברכבי Strong Luxury Cars.

אנו מקווים שנזכה לשרת אותך בעתיד.

נשמח לעמוד לרשותך בכל שאלה או בקשה.

בברכה,
צוות Strong Luxury Cars`;

  if (lead.whatsapp || lead.phone) {
    await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
    
    await addCommunicationRecord(lead.id, {
      type: 'whatsapp',
      direction: 'outbound',
      content: message,
      status: 'sent'
    });
  }
};

// Send follow-up reminder
export const sendFollowUpReminder = async (lead: Lead): Promise<void> => {
  try {
    const message = `שלום ${lead.firstName}!

רצינו לבדוק איך מתקדם התהליך?

האם יש שאלות נוספות או תרצה לקבוע פגישה?

לשאלות: 050-1234567

בברכה,
צוות Strong Luxury Cars`;

    if (lead.whatsapp || lead.phone) {
      await sendWhatsAppMessage(lead.whatsapp || lead.phone, message);
      
      await addCommunicationRecord(lead.id, {
        type: 'whatsapp',
        direction: 'outbound',
        content: message,
        status: 'sent'
      });
    }
  } catch (error) {
    console.error('Error sending follow-up reminder:', error);
  }
};

// Send car information
export const sendCarInformation = async (lead: Lead, car: any): Promise<void> => {
  try {
    await sendCarInfoMessage(lead, car);
  } catch (error) {
    console.error('Error sending car information:', error);
  }
};

// Get leads that need follow-up
export const getLeadsNeedingFollowUp = async (): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .not('status', 'in', ['closed', 'lost'])
      .lt('next_follow_up_date', new Date().toISOString())
      .order('next_follow_up_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting leads needing follow-up:', error);
    return [];
  }
};

// Update next follow-up date
export const updateNextFollowUp = async (
  leadId: string, 
  daysFromNow: number = 3
): Promise<void> => {
  try {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysFromNow);

    const { error } = await supabase
      .from('leads')
      .update({ next_follow_up_date: nextDate.toISOString() })
      .eq('id', leadId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating next follow-up date:', error);
  }
};
