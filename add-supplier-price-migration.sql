-- Migration to add supplier_price column to items table for Flipkart Grocery support
-- Run this SQL script on your database

ALTER TABLE items ADD COLUMN IF NOT EXISTS supplier_price DECIMAL(12,2);

-- Add some sample supplier prices for testing (optional)
-- UPDATE items SET supplier_price = basic_rate * 0.9 WHERE supplier_price IS NULL;

COMMENT ON COLUMN items.supplier_price IS 'Supplier price specifically for Flipkart Grocery platform';