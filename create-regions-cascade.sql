-- Migration to create proper regions -> states -> districts cascade
-- Step 1: Create regions table

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL UNIQUE,
    region_code VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Insert default regions
INSERT INTO regions (region_name, region_code) VALUES 
    ('NORTH INDIA', 'NORTH'),
    ('SOUTH INDIA', 'SOUTH'),
    ('WEST INDIA', 'WEST'),
    ('EAST INDIA', 'EAST'),
    ('CENTRAL INDIA', 'CENTRAL');

-- Step 3: Add region_id column to states table
ALTER TABLE states ADD COLUMN region_id INTEGER REFERENCES regions(id);

-- Step 4: Update states with proper geographical region assignments
-- NORTH INDIA: Northern states including Delhi, Punjab, Haryana, UP, Himachal, J&K, etc.
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'NORTH INDIA') 
WHERE UPPER(statename) IN (
    'DELHI', 'HARYANA', 'PUNJAB', 'HIMACHAL PRADESH', 
    'UTTAR PRADESH', 'UTTARAKHAND', 'JAMMU AND KASHMIR', 'LADAKH', 
    'CHANDIGARH'
);

-- SOUTH INDIA: Southern peninsula states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'SOUTH INDIA') 
WHERE UPPER(statename) IN (
    'KARNATAKA', 'TAMIL NADU', 'KERALA', 'ANDHRA PRADESH', 
    'TELANGANA', 'PUDUCHERRY', 'LAKSHADWEEP', 
    'ANDAMAN AND NICOBAR ISLANDS'
);

-- WEST INDIA: Western coast and western states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'WEST INDIA') 
WHERE UPPER(statename) IN (
    'MAHARASHTRA', 'GUJARAT', 'RAJASTHAN', 'GOA', 
    'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU'
);

-- EAST INDIA: Eastern states including Bengal, Bihar, Northeast
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'EAST INDIA') 
WHERE UPPER(statename) IN (
    'WEST BENGAL', 'ODISHA', 'BIHAR', 'JHARKHAND', 
    'ASSAM', 'MEGHALAYA', 'MANIPUR', 'MIZORAM', 'NAGALAND', 
    'TRIPURA', 'ARUNACHAL PRADESH', 'SIKKIM'
);

-- CENTRAL INDIA: Central states
UPDATE states SET region_id = (SELECT id FROM regions WHERE region_name = 'CENTRAL INDIA') 
WHERE UPPER(statename) IN (
    'MADHYA PRADESH', 'CHHATTISGARH'
);

-- Step 5: Check for unassigned states
SELECT 'UNASSIGNED STATES' as category, statename 
FROM states 
WHERE region_id IS NULL 
ORDER BY statename;

-- Step 6: Verify the setup
SELECT 
    r.region_name,
    COUNT(s.id) as state_count,
    STRING_AGG(s.statename, ', ' ORDER BY s.statename) as states
FROM regions r
LEFT JOIN states s ON s.region_id = r.id
GROUP BY r.id, r.region_name
ORDER BY r.region_name;

-- Step 6: Test the cascade
SELECT 
    r.region_name,
    s.statename,
    COUNT(d.id) as district_count
FROM regions r
JOIN states s ON s.region_id = r.id
LEFT JOIN districts d ON d.state_id = s.id
GROUP BY r.id, r.region_name, s.id, s.statename
ORDER BY r.region_name, s.statename;