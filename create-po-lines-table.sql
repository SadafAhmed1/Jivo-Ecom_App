-- Create po_lines table to store line items for po_master
CREATE TABLE IF NOT EXISTS po_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_master_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    platform_code VARCHAR(50),
    sap_code VARCHAR(50),
    uom VARCHAR(20) DEFAULT 'PCS',
    quantity DECIMAL(12,2) NOT NULL,
    boxes INTEGER,
    unit_size_ltrs DECIMAL(10,3),
    loose_qty INTEGER,
    basic_amount DECIMAL(10,2) NOT NULL,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    landing_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_master_id) REFERENCES po_master(id)
);

-- Create index for faster queries
CREATE INDEX idx_po_lines_master_id ON po_lines(po_master_id);