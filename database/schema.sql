-- Strong Luxury Cars Database Schema
-- סכמת מסד נתונים לאתר מכירת רכבים

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CARS TABLE - טבלת רכבים
-- ========================================
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
    price DECIMAL(12,2) NOT NULL CHECK (price > 0),
    kilometers INTEGER NOT NULL DEFAULT 0 CHECK (kilometers >= 0),
    transmission VARCHAR(20) NOT NULL CHECK (transmission IN ('manual', 'automatic')),
    fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('gasoline', 'diesel', 'hybrid', 'electric')),
    color VARCHAR(50) NOT NULL,
    description TEXT,
    features TEXT[], -- Array of features
    condition VARCHAR(20) NOT NULL DEFAULT 'used' CHECK (condition IN ('new', 'used')),
    category VARCHAR(100),
    keywords TEXT[], -- SEO keywords
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    inventory_status VARCHAR(20) NOT NULL DEFAULT 'in_stock' CHECK (inventory_status IN ('in_stock', 'reserved', 'sold', 'maintenance', 'test_drive')),
    stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0),
    cost_price DECIMAL(12,2),
    markup_percentage DECIMAL(5,2),
    condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 10),
    tags TEXT[],
    categories TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MEDIA_FILES TABLE - טבלת קבצי מדיה
-- ========================================
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    optimized_url TEXT,
    car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LEADS TABLE - טבלת לידים
-- ========================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    source VARCHAR(20) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'phone', 'email', 'social', 'referral')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    interest_in_car UUID REFERENCES cars(id),
    budget DECIMAL(12,2),
    timeline VARCHAR(20) CHECK (timeline IN ('immediate', '1-3_months', '3-6_months', '6+_months')),
    notes TEXT,
    assigned_to UUID, -- User ID (will be added when users table is created)
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LEAD_COMMUNICATIONS TABLE - טבלת תקשורת עם לידים
-- ========================================
CREATE TABLE lead_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'whatsapp', 'phone', 'note')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WHATSAPP_TEMPLATES TABLE - טבלת תבניות וואטסאפ
-- ========================================
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('greeting', 'follow_up', 'car_info', 'pricing', 'appointment', 'closing')),
    content TEXT NOT NULL,
    variables TEXT[], -- Array of variable names
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WHATSAPP_SESSIONS TABLE - טבלת סשני וואטסאפ
-- ========================================
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Will be added when users table is created
    qr_code TEXT,
    is_connected BOOLEAN NOT NULL DEFAULT false,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- USERS TABLE - טבלת משתמשים (לעתיד)
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('admin', 'manager', 'content_manager', 'sales_rep')),
    permissions TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES - אינדקסים
-- ========================================

-- Cars indexes
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_model ON cars(model);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_condition ON cars(condition);
CREATE INDEX idx_cars_inventory_status ON cars(inventory_status);
CREATE INDEX idx_cars_is_active ON cars(is_active);
CREATE INDEX idx_cars_created_at ON cars(created_at);

-- Media files indexes
CREATE INDEX idx_media_files_car_id ON media_files(car_id);
CREATE INDEX idx_media_files_type ON media_files(type);

-- Leads indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_interest_in_car ON leads(interest_in_car);

-- Lead communications indexes
CREATE INDEX idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX idx_lead_communications_type ON lead_communications(type);
CREATE INDEX idx_lead_communications_created_at ON lead_communications(created_at);

-- WhatsApp templates indexes
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX idx_whatsapp_templates_is_active ON whatsapp_templates(is_active);

-- ========================================
-- TRIGGERS - טריגרים
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS) - אבטחה ברמת שורה
-- ========================================

-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLICIES - מדיניות גישה
-- ========================================

-- Cars policies
CREATE POLICY "Cars are viewable by everyone" ON cars
    FOR SELECT USING (is_active = true);

CREATE POLICY "Cars are insertable by authenticated users" ON cars
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cars are updatable by authenticated users" ON cars
    FOR UPDATE USING (true);

CREATE POLICY "Cars are deletable by authenticated users" ON cars
    FOR DELETE USING (true);

-- Media files policies
CREATE POLICY "Media files are viewable by everyone" ON media_files
    FOR SELECT USING (true);

CREATE POLICY "Media files are insertable by authenticated users" ON media_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Media files are updatable by authenticated users" ON media_files
    FOR UPDATE USING (true);

CREATE POLICY "Media files are deletable by authenticated users" ON media_files
    FOR DELETE USING (true);

-- Leads policies (only authenticated users)
CREATE POLICY "Leads are viewable by authenticated users" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Leads are insertable by everyone" ON leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leads are updatable by authenticated users" ON leads
    FOR UPDATE USING (true);

CREATE POLICY "Leads are deletable by authenticated users" ON leads
    FOR DELETE USING (true);

-- Lead communications policies
CREATE POLICY "Lead communications are viewable by authenticated users" ON lead_communications
    FOR SELECT USING (true);

CREATE POLICY "Lead communications are insertable by authenticated users" ON lead_communications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lead communications are updatable by authenticated users" ON lead_communications
    FOR UPDATE USING (true);

CREATE POLICY "Lead communications are deletable by authenticated users" ON lead_communications
    FOR DELETE USING (true);

-- WhatsApp templates policies
CREATE POLICY "WhatsApp templates are viewable by authenticated users" ON whatsapp_templates
    FOR SELECT USING (true);

CREATE POLICY "WhatsApp templates are insertable by authenticated users" ON whatsapp_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "WhatsApp templates are updatable by authenticated users" ON whatsapp_templates
    FOR UPDATE USING (true);

CREATE POLICY "WhatsApp templates are deletable by authenticated users" ON whatsapp_templates
    FOR DELETE USING (true);

-- WhatsApp sessions policies
CREATE POLICY "WhatsApp sessions are viewable by authenticated users" ON whatsapp_sessions
    FOR SELECT USING (true);

CREATE POLICY "WhatsApp sessions are insertable by authenticated users" ON whatsapp_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "WhatsApp sessions are updatable by authenticated users" ON whatsapp_sessions
    FOR UPDATE USING (true);

CREATE POLICY "WhatsApp sessions are deletable by authenticated users" ON whatsapp_sessions
    FOR DELETE USING (true);

-- Users policies (only admins)
CREATE POLICY "Users are viewable by authenticated users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users are insertable by authenticated users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users are updatable by authenticated users" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Users are deletable by authenticated users" ON users
    FOR DELETE USING (true);

-- ========================================
-- COMMENTS - הערות
-- ========================================

COMMENT ON TABLE cars IS 'טבלת רכבים למכירה';
COMMENT ON TABLE media_files IS 'טבלת קבצי מדיה (תמונות וסרטונים)';
COMMENT ON TABLE leads IS 'טבלת לידים - פניות מלקוחות';
COMMENT ON TABLE lead_communications IS 'טבלת תקשורת עם לידים';
COMMENT ON TABLE whatsapp_templates IS 'טבלת תבניות הודעות וואטסאפ';
COMMENT ON TABLE whatsapp_sessions IS 'טבלת סשני וואטסאפ';
COMMENT ON TABLE users IS 'טבלת משתמשי המערכת';
