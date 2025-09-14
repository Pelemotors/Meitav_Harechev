-- מערכת ניהול לידים מתקדמת
-- Advanced Leads Management System

-- טבלת לידים ראשית
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- פרטי קשר בסיסיים
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- פרטי הליד
    lead_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, car_inquiry, financing, service
    source VARCHAR(100) DEFAULT 'website', -- website, phone, referral, social_media, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, contacted, qualified, converted, lost
    
    -- רכבים מעניינים
    interested_cars JSONB DEFAULT '[]', -- רשימת ID של רכבים שהליד מתעניין בהם
    
    -- הערות ומידע נוסף
    notes TEXT,
    budget_min INTEGER,
    budget_max INTEGER,
    
    -- העדפות מימון
    financing_needed BOOLEAN DEFAULT FALSE,
    down_payment INTEGER,
    monthly_payment_max INTEGER,
    
    -- מעקב
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    assigned_to UUID REFERENCES auth.users(id),
    
    -- מטא דאטה
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_at TIMESTAMP WITH TIME ZONE,
    
    -- אינדקסים
    CONSTRAINT leads_phone_check CHECK (phone ~ '^[0-9+\-\s()]+$'),
    CONSTRAINT leads_email_check CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT leads_budget_check CHECK (budget_min IS NULL OR budget_min >= 0),
    CONSTRAINT leads_budget_max_check CHECK (budget_max IS NULL OR budget_max >= budget_min)
);

-- טבלת תקשורת עם לידים
CREATE TABLE IF NOT EXISTS lead_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- סוג התקשרות
    communication_type VARCHAR(50) NOT NULL, -- call, email, sms, whatsapp, meeting, note
    
    -- תוכן התקשרות
    subject VARCHAR(255),
    content TEXT NOT NULL,
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    
    -- מי ביצע את התקשרות
    user_id UUID REFERENCES auth.users(id),
    
    -- תוצאות
    outcome VARCHAR(100), -- interested, not_interested, callback_requested, etc.
    follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- מטא דאטה
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- אינדקסים
    CONSTRAINT lead_communications_direction_check CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT lead_communications_type_check CHECK (communication_type IN ('call', 'email', 'sms', 'whatsapp', 'meeting', 'note'))
);

-- טבלת משימות מעקב
CREATE TABLE IF NOT EXISTS lead_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- פרטי המשימה
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL, -- call, email, meeting, follow_up, etc.
    
    -- תאריכים
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- סטטוס
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    
    -- מי אחראי
    assigned_to UUID REFERENCES auth.users(id),
    
    -- מטא דאטה
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- אינדקסים
    CONSTRAINT lead_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- טבלת תבניות הודעות
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- פרטי התבנית
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- welcome, follow_up, appointment, etc.
    template_type VARCHAR(50) NOT NULL, -- email, sms, whatsapp
    
    -- תוכן התבנית
    subject VARCHAR(255), -- לאימייל
    content TEXT NOT NULL,
    
    -- משתנים דינמיים
    variables JSONB DEFAULT '[]', -- רשימת משתנים שניתן להחליף
    
    -- מטא דאטה
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- אינדקסים
    CONSTRAINT message_templates_type_check CHECK (template_type IN ('email', 'sms', 'whatsapp'))
);

-- טבלת סטטיסטיקות לידים
CREATE TABLE IF NOT EXISTS lead_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- תאריך
    date DATE NOT NULL,
    
    -- סטטיסטיקות
    new_leads INTEGER DEFAULT 0,
    contacted_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    converted_leads INTEGER DEFAULT 0,
    lost_leads INTEGER DEFAULT 0,
    
    -- מקורות לידים
    website_leads INTEGER DEFAULT 0,
    phone_leads INTEGER DEFAULT 0,
    referral_leads INTEGER DEFAULT 0,
    social_leads INTEGER DEFAULT 0,
    
    -- מטא דאטה
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- אינדקסים
    UNIQUE(date)
);

-- אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_id ON lead_communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_communications_created_at ON lead_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_communications_type ON lead_communications(communication_type);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_status ON lead_tasks(status);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_date ON lead_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON lead_tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);

-- טריגרים לעדכון timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_tasks_updated_at BEFORE UPDATE ON lead_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_analytics_updated_at BEFORE UPDATE ON lead_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- טריגר לעדכון last_contact_at בלידים
CREATE OR REPLACE FUNCTION update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET last_contact_at = NEW.created_at
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_last_contact_trigger 
    AFTER INSERT ON lead_communications
    FOR EACH ROW EXECUTE FUNCTION update_lead_last_contact();

-- RLS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_analytics ENABLE ROW LEVEL SECURITY;

-- מדיניות RLS ללידים
CREATE POLICY "Leads are viewable by authenticated users" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Leads are insertable by authenticated users" ON leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Leads are updatable by authenticated users" ON leads
    FOR UPDATE USING (true);

CREATE POLICY "Leads are deletable by authenticated users" ON leads
    FOR DELETE USING (true);

-- מדיניות RLS לתקשורת
CREATE POLICY "Lead communications are viewable by authenticated users" ON lead_communications
    FOR SELECT USING (true);

CREATE POLICY "Lead communications are insertable by authenticated users" ON lead_communications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lead communications are updatable by authenticated users" ON lead_communications
    FOR UPDATE USING (true);

CREATE POLICY "Lead communications are deletable by authenticated users" ON lead_communications
    FOR DELETE USING (true);

-- מדיניות RLS למשימות
CREATE POLICY "Lead tasks are viewable by authenticated users" ON lead_tasks
    FOR SELECT USING (true);

CREATE POLICY "Lead tasks are insertable by authenticated users" ON lead_tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lead tasks are updatable by authenticated users" ON lead_tasks
    FOR UPDATE USING (true);

CREATE POLICY "Lead tasks are deletable by authenticated users" ON lead_tasks
    FOR DELETE USING (true);

-- מדיניות RLS לתבניות הודעות
CREATE POLICY "Message templates are viewable by authenticated users" ON message_templates
    FOR SELECT USING (true);

CREATE POLICY "Message templates are insertable by authenticated users" ON message_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Message templates are updatable by authenticated users" ON message_templates
    FOR UPDATE USING (true);

CREATE POLICY "Message templates are deletable by authenticated users" ON message_templates
    FOR DELETE USING (true);

-- מדיניות RLS לסטטיסטיקות
CREATE POLICY "Lead analytics are viewable by authenticated users" ON lead_analytics
    FOR SELECT USING (true);

CREATE POLICY "Lead analytics are insertable by authenticated users" ON lead_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lead analytics are updatable by authenticated users" ON lead_analytics
    FOR UPDATE USING (true);

CREATE POLICY "Lead analytics are deletable by authenticated users" ON lead_analytics
    FOR DELETE USING (true);

-- יצירת תבניות הודעות ברירת מחדל
INSERT INTO message_templates (name, category, template_type, subject, content, variables) VALUES
('ברוכים הבאים', 'welcome', 'email', 'ברוכים הבאים למיטב הרכב!', 
'שלום {firstName}!

תודה על פנייתך למיטב הרכב - סוכנות הרכב של חדרה.

נציגנו יצור איתך קשר בהקדם כדי לעזור לך למצוא את הרכב המתאים ביותר.

פרטי התקשרות שלנו:
אסי: 050-7422522
אלון: 053-5335540

בברכה,
צוות מיטב הרכב', 
'["firstName", "lastName", "phone"]'),

('זימון פגישה', 'appointment', 'sms', NULL, 
'שלום {firstName}! 

נשמח לזמן לך פגישה במיטב הרכב כדי להציג לך את הרכבים המתאימים.

מתי נוח לך?

אסי: 050-7422522
אלון: 053-5335540', 
'["firstName", "phone"]'),

('מעקב אחר פנייה', 'follow_up', 'whatsapp', NULL, 
'שלום {firstName}! 

איך אתה? רציתי לעקוב אחר הפנייה שלך למיטב הרכב.

האם עדיין מעוניין ברכב? יש לנו הצעות חדשות שעלולות לעניין אותך.

אסי: 050-7422522', 
'["firstName", "phone"]');

-- יצירת View לסיכום לידים
CREATE OR REPLACE VIEW lead_summary AS
SELECT 
    l.id,
    l.first_name,
    l.last_name,
    l.phone,
    l.email,
    l.lead_type,
    l.source,
    l.status,
    l.priority,
    l.created_at,
    l.last_contact_at,
    l.assigned_to,
    u.email as assigned_to_email,
    
    -- ספירת תקשורות
    (SELECT COUNT(*) FROM lead_communications lc WHERE lc.lead_id = l.id) as communications_count,
    
    -- תקשורת אחרונה
    (SELECT lc2.created_at FROM lead_communications lc2 WHERE lc2.lead_id = l.id ORDER BY lc2.created_at DESC LIMIT 1) as last_communication,
    
    -- משימות ממתינות
    (SELECT COUNT(*) FROM lead_tasks lt WHERE lt.lead_id = l.id AND lt.status = 'pending') as pending_tasks,
    
    -- משימה הבאה
    (SELECT lt2.due_date FROM lead_tasks lt2 WHERE lt2.lead_id = l.id AND lt2.status = 'pending' ORDER BY lt2.due_date ASC LIMIT 1) as next_task_due
    
FROM leads l
LEFT JOIN auth.users u ON l.assigned_to = u.id
ORDER BY l.created_at DESC;

-- הוספת הערות
COMMENT ON TABLE leads IS 'טבלת לידים ראשית - מכילה את כל המידע הבסיסי על לידים פוטנציאליים';
COMMENT ON TABLE lead_communications IS 'טבלת תקשורת עם לידים - מעקב אחר כל התקשרות עם הלקוחות';
COMMENT ON TABLE lead_tasks IS 'טבלת משימות מעקב - משימות שצריך לבצע עם כל ליד';
COMMENT ON TABLE message_templates IS 'טבלת תבניות הודעות - תבניות מוכנות להודעות אימייל, SMS ו-WhatsApp';
COMMENT ON TABLE lead_analytics IS 'טבלת סטטיסטיקות יומיות של לידים';

SELECT 'מערכת ניהול לידים נוצרה בהצלחה!' as status;
