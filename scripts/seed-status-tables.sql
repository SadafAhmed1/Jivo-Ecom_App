-- Seed data for statuses table (PO statuses)
INSERT INTO statuses (status_name, description, is_active) VALUES
('OPEN', 'Purchase order is open and active', true),
('CLOSED', 'Purchase order is closed/completed', true),
('CANCELLED', 'Purchase order has been cancelled', true),
('EXPIRED', 'Purchase order has expired', true),
('DUPLICATE', 'Purchase order is marked as duplicate', true),
('INVOICED', 'Purchase order has been invoiced', true)
ON CONFLICT (status_name) DO NOTHING;

-- Seed data for status_item table (Item statuses)
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