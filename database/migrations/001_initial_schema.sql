-- Initial Schema Migration for Strong Luxury Cars
-- מיגרציה ראשונית לאתר מכירת רכבים

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cars table
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
    features TEXT[],
    condition VARCHAR(20) NOT NULL DEFAULT 'used' CHECK (condition IN ('new', 'used')),
    category VARCHAR(100),
    keywords TEXT[],
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

-- Create media_files table
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

-- Create leads table
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
    assigned_to UUID,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_model ON cars(model);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_condition ON cars(condition);
CREATE INDEX idx_cars_inventory_status ON cars(inventory_status);
CREATE INDEX idx_cars_is_active ON cars(is_active);
CREATE INDEX idx_cars_created_at ON cars(created_at);

CREATE INDEX idx_media_files_car_id ON media_files(car_id);
CREATE INDEX idx_media_files_type ON media_files(type);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_interest_in_car ON leads(interest_in_car);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
