-- Create attachment tables for all platforms

-- Zepto Attachments
CREATE TABLE IF NOT EXISTS zepto_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES zepto_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zepto Comments
CREATE TABLE IF NOT EXISTS zepto_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES zepto_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flipkart Attachments
CREATE TABLE IF NOT EXISTS flipkart_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES flipkart_grocery_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flipkart Comments
CREATE TABLE IF NOT EXISTS flipkart_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES flipkart_grocery_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blinkit Attachments
CREATE TABLE IF NOT EXISTS blinkit_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES blinkit_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blinkit Comments
CREATE TABLE IF NOT EXISTS blinkit_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES blinkit_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swiggy Attachments
CREATE TABLE IF NOT EXISTS swiggy_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES swiggy_pos(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swiggy Comments
CREATE TABLE IF NOT EXISTS swiggy_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES swiggy_pos(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BigBasket Attachments
CREATE TABLE IF NOT EXISTS bigbasket_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES bigbasket_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BigBasket Comments
CREATE TABLE IF NOT EXISTS bigbasket_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES bigbasket_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zomato Attachments
CREATE TABLE IF NOT EXISTS zomato_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES zomato_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zomato Comments
CREATE TABLE IF NOT EXISTS zomato_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES zomato_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealshare Attachments
CREATE TABLE IF NOT EXISTS dealshare_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES dealshare_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealshare Comments
CREATE TABLE IF NOT EXISTS dealshare_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES dealshare_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CityMall Attachments
CREATE TABLE IF NOT EXISTS citymall_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES city_mall_po_header(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CityMall Comments
CREATE TABLE IF NOT EXISTS citymall_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES city_mall_po_header(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform PO Attachments (for pf_po)
CREATE TABLE IF NOT EXISTS platform_po_attachments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES pf_po(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform PO Comments (for pf_po)
CREATE TABLE IF NOT EXISTS platform_po_comments (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES pf_po(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_zepto_attachments_po_id ON zepto_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_zepto_comments_po_id ON zepto_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_flipkart_attachments_po_id ON flipkart_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_flipkart_comments_po_id ON flipkart_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_blinkit_attachments_po_id ON blinkit_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_blinkit_comments_po_id ON blinkit_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_swiggy_attachments_po_id ON swiggy_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_swiggy_comments_po_id ON swiggy_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_bigbasket_attachments_po_id ON bigbasket_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_bigbasket_comments_po_id ON bigbasket_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_zomato_attachments_po_id ON zomato_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_zomato_comments_po_id ON zomato_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_dealshare_attachments_po_id ON dealshare_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_dealshare_comments_po_id ON dealshare_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_citymall_attachments_po_id ON citymall_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_citymall_comments_po_id ON citymall_comments(po_id);
CREATE INDEX IF NOT EXISTS idx_platform_po_attachments_po_id ON platform_po_attachments(po_id);
CREATE INDEX IF NOT EXISTS idx_platform_po_comments_po_id ON platform_po_comments(po_id);