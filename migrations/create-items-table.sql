-- Create items table in PostgreSQL to store item master data
-- This table will be populated from HANA SP_GET_ITEM_DETAILS stored procedure

-- Drop table if exists (be careful in production!)
DROP TABLE IF EXISTS items;

-- Create the items table with all necessary columns
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    itemcode VARCHAR(50) NOT NULL UNIQUE,
    itemname TEXT NOT NULL,
    itemgroup VARCHAR(100),
    type VARCHAR(50),
    variety VARCHAR(100),
    subgroup VARCHAR(100),
    brand VARCHAR(100),
    uom VARCHAR(20),
    taxrate DECIMAL(5, 2),
    unitsize VARCHAR(50),
    is_litre BOOLEAN DEFAULT FALSE,
    case_pack INTEGER,
    basic_rate DECIMAL(12, 2),
    landing_rate DECIMAL(12, 2),
    mrp DECIMAL(12, 2),
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX idx_items_itemname ON items(itemname);
CREATE INDEX idx_items_itemcode ON items(itemcode);
CREATE INDEX idx_items_brand ON items(brand);
CREATE INDEX idx_items_itemgroup ON items(itemgroup);

-- Create a text search index for full-text search
CREATE INDEX idx_items_fulltext ON items USING gin(to_tsvector('english', itemname || ' ' || COALESCE(brand, '') || ' ' || COALESCE(itemgroup, '')));

-- Add comments to the table
COMMENT ON TABLE items IS 'Master table for all items, populated from HANA SP_GET_ITEM_DETAILS';
COMMENT ON COLUMN items.itemcode IS 'Unique item code from SAP';
COMMENT ON COLUMN items.itemname IS 'Item name/description';
COMMENT ON COLUMN items.last_synced IS 'Last time this record was synced from HANA';

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER items_updated_at_trigger
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_items_updated_at();

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON items TO your_app_user;
-- GRANT INSERT, UPDATE ON items TO your_admin_user;

SELECT 'Items table created successfully' AS status;