-- Create statuses table for PO statuses
CREATE TABLE IF NOT EXISTS statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create status_item table for item statuses  
CREATE TABLE IF NOT EXISTS status_item (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    requires_invoice_fields BOOLEAN DEFAULT FALSE,
    requires_dispatch_date BOOLEAN DEFAULT FALSE,
    requires_delivery_date BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert PO statuses
INSERT INTO statuses (status_name, description, is_active) VALUES
('OPEN', 'Purchase order is open and active', true),
('CLOSED', 'Purchase order is closed/completed', true),
('CANCELLED', 'Purchase order has been cancelled', true),
('EXPIRED', 'Purchase order has expired', true),
('DUPLICATE', 'Purchase order is marked as duplicate', true),
('INVOICED', 'Purchase order has been invoiced', true)
ON CONFLICT (status_name) DO NOTHING;

-- Insert item statuses
INSERT INTO status_item (status_name, description, requires_invoice_fields, requires_dispatch_date, requires_delivery_date, is_active) VALUES
('PENDING', 'Item is pending processing', false, false, false, true),
('DISPATCHED', 'Item has been dispatched', false, true, false, true),
('DELIVERED', 'Item has been delivered', false, true, true, true),
('INVOICED', 'Item has been invoiced', true, false, false, true),
('CANCELLED', 'Item has been cancelled', false, false, false, true),
('STOCK_ISSUE', 'Item has stock issues', false, false, false, true),
('RECEIVED', 'Item has been received', false, false, false, true),
('PARTIAL', 'Item partially fulfilled', false, false, false, true)
ON CONFLICT (status_name) DO NOTHING;