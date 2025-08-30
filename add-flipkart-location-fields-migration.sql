-- Add distributor and location fields to flipkart_grocery_po_header table
ALTER TABLE flipkart_grocery_po_header 
ADD COLUMN distributor VARCHAR(200),
ADD COLUMN area VARCHAR(100),
ADD COLUMN city VARCHAR(100),
ADD COLUMN region VARCHAR(100),
ADD COLUMN state VARCHAR(100),
ADD COLUMN dispatch_from VARCHAR(100);

-- Add comment to document the change
COMMENT ON COLUMN flipkart_grocery_po_header.distributor IS 'Serving distributor for this PO';
COMMENT ON COLUMN flipkart_grocery_po_header.area IS 'Delivery area';
COMMENT ON COLUMN flipkart_grocery_po_header.city IS 'Delivery city';
COMMENT ON COLUMN flipkart_grocery_po_header.region IS 'Delivery region';
COMMENT ON COLUMN flipkart_grocery_po_header.state IS 'Delivery state';
COMMENT ON COLUMN flipkart_grocery_po_header.dispatch_from IS 'Dispatch location';