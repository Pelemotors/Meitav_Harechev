-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'phone', 'email', 'social', 'referral')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  interest_in_car UUID REFERENCES cars(id) ON DELETE SET NULL,
  budget INTEGER,
  timeline TEXT CHECK (timeline IN ('immediate', '1-3_months', '3-6_months', '6+_months')),
  notes TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_communications table
CREATE TABLE IF NOT EXISTS lead_communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'phone', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('greeting', 'follow_up', 'car_info', 'pricing', 'appointment', 'closing')),
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_communications_created_at ON lead_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id ON whatsapp_sessions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default WhatsApp templates
INSERT INTO whatsapp_templates (name, category, content, variables) VALUES
('ברכה ראשונית', 'greeting', 'שלום {{firstName}}! תודה על פנייתך ל-Strong Luxury Cars. איך נוכל לעזור לך היום?', ARRAY['firstName']),
('מידע רכב', 'car_info', 'שלום {{firstName}}! הנה פרטי הרכב {{carName}}:\n\nמחיר: {{price}}\nשנה: {{year}}\nקילומטראז': {{kilometers}}\n\nהאם תרצה לקבוע פגישה לצפייה?', ARRAY['firstName', 'carName', 'price', 'year', 'kilometers']),
('מעקב', 'follow_up', 'שלום {{firstName}}! רצינו לבדוק איך מתקדם התהליך? האם יש שאלות נוספות?', ARRAY['firstName']),
('קביעת פגישה', 'appointment', 'שלום {{firstName}}! נשמח לקבוע פגישה לצפייה ברכב {{carName}}. מתי נוח לך?', ARRAY['firstName', 'carName']),
('הצעה', 'pricing', 'שלום {{firstName}}! הנה הצעתנו לרכב {{carName}}:\n\nמחיר: {{price}}\nתנאי מימון: {{financeTerms}}\n\nמה דעתך?', ARRAY['firstName', 'carName', 'price', 'financeTerms']),
('סגירה', 'closing', 'מזל טוב {{firstName}}! שמחים על הרכישה. נציגנו יצור איתך קשר בקרוב לפרטי הגמר.', ARRAY['firstName'])
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Leads policies
CREATE POLICY "Users can view leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update leads" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Lead communications policies
CREATE POLICY "Users can view lead communications" ON lead_communications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert lead communications" ON lead_communications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- WhatsApp templates policies
CREATE POLICY "Users can view whatsapp templates" ON whatsapp_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage whatsapp templates" ON whatsapp_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- WhatsApp sessions policies
CREATE POLICY "Users can view their own whatsapp sessions" ON whatsapp_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own whatsapp sessions" ON whatsapp_sessions
  FOR ALL USING (auth.uid() = user_id);
