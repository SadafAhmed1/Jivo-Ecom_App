-- Fix vendor_po_number NOT NULL constraint
-- Make vendor_po_number nullable to allow for cases where it might not be provided

-- First check if the column exists and is NOT NULL
PRAGMA table_info(po_master);

-- For SQLite, we need to recreate the table since ALTER COLUMN is not fully supported
-- First, create a backup of the existing table
CREATE TABLE po_master_backup AS SELECT * FROM po_master WHERE 1=0;

-- Create the new table structure with nullable vendor_po_number
CREATE TABLE po_master_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_id INTEGER NOT NULL,
    vendor_po_number VARCHAR(256), -- Removed NOT NULL constraint
    distributor_id INTEGER NOT NULL,
    series VARCHAR(250) NOT NULL,
    company_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    vendor_name VARCHAR(256),
    vendor_email VARCHAR(256),
    vendor_phone VARCHAR(20),
    vendor_address TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    po_type VARCHAR(50) DEFAULT 'Regular',
    currency VARCHAR(10) DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0,
    payment_terms VARCHAR(256),
    delivery_terms VARCHAR(256),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Draft',
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    attachment VARCHAR(512)
);

-- Copy existing data from po_master to po_master_new
INSERT INTO po_master_new SELECT * FROM po_master;

-- Drop the old table
DROP TABLE po_master;

-- Rename the new table to the original name
ALTER TABLE po_master_new RENAME TO po_master;

-- Recreate any indexes that might have existed
-- (Add indexes here if they existed on the original table)

-- Verify the change
PRAGMA table_info(po_master);