-- Quick test data seeding for regions cascade testing
-- This creates minimal test data to verify the cascade works

-- Create regions table if not exists (from migration)
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL UNIQUE,
    region_code VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert test regions
INSERT INTO regions (region_name, region_code) VALUES 
    ('NORTH INDIA', 'NORTH'),
    ('SOUTH INDIA', 'SOUTH'),
    ('WEST INDIA', 'WEST'),
    ('EAST INDIA', 'EAST'),
    ('CENTRAL INDIA', 'CENTRAL')
ON CONFLICT (region_name) DO NOTHING;

-- Add region_id column to states if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='states' AND column_name='region_id') THEN
        ALTER TABLE states ADD COLUMN region_id INTEGER REFERENCES regions(id);
    END IF;
END $$;

-- Add some test state assignments for a few states to test functionality
-- NORTH INDIA - Just a few key northern states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'NORTH INDIA') 
WHERE UPPER(statename) IN ('DELHI', 'HARYANA', 'PUNJAB', 'UTTAR PRADESH') AND region_id IS NULL;

-- SOUTH INDIA - Just a few key southern states  
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'SOUTH INDIA') 
WHERE UPPER(statename) IN ('KARNATAKA', 'TAMIL NADU', 'KERALA', 'ANDHRA PRADESH') AND region_id IS NULL;

-- WEST INDIA - Just a few key western states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'WEST INDIA') 
WHERE UPPER(statename) IN ('MAHARASHTRA', 'GUJARAT', 'RAJASTHAN') AND region_id IS NULL;

-- EAST INDIA - Just a few key eastern states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'EAST INDIA') 
WHERE UPPER(statename) IN ('WEST BENGAL', 'BIHAR', 'ODISHA') AND region_id IS NULL;

-- CENTRAL INDIA - Central states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'CENTRAL INDIA') 
WHERE UPPER(statename) IN ('MADHYA PRADESH', 'CHHATTISGARH') AND region_id IS NULL;

-- Verify the assignments
SELECT 
    r.id as region_id,
    r.region_name,
    COUNT(s.id) as assigned_states,
    STRING_AGG(s.statename, ', ' ORDER BY s.statename) as states
FROM regions r
LEFT JOIN states s ON s.region_id = r.id
GROUP BY r.id, r.region_name
ORDER BY r.region_name;

-- Show test data for NORTH INDIA specifically
SELECT 
    r.region_name,
    s.id as state_id,
    s.statename,
    COUNT(d.id) as district_count
FROM regions r
JOIN states s ON s.region_id = r.id
LEFT JOIN districts d ON d.state_id = s.id
WHERE r.region_name = 'NORTH INDIA'
GROUP BY r.region_name, s.id, s.statename
ORDER BY s.statename;