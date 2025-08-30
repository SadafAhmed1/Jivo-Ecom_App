-- RBAC (Role-Based Access Control) System Database Schema
-- This creates a comprehensive permission system for user management

-- 1. Roles Table - Define different user roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Permissions Table - Define what actions can be performed
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- e.g., 'sidebar', 'po', 'inventory', 'users'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Role Permissions Table - Link roles to permissions (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 4. Update existing users table to include role system
DO $$ 
BEGIN
    -- Add role_id to users table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role_id') THEN
        ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
    END IF;
    
    -- Add status column for user management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- Add last_login tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;
    
    -- Add created_by for audit trail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_by') THEN
        ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id);
    END IF;
END $$;

-- 5. User Sessions Table - Track active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Insert default roles
INSERT INTO roles (role_name, description, is_admin) VALUES 
    ('Super Admin', 'Full system access - can manage everything', true),
    ('Admin', 'Administrative access - can manage users and most features', true),
    ('Inventory Manager', 'Can manage inventory and view related reports', false),
    ('Secondary Sales Manager', 'Can manage secondary sales data and reports', false),
    ('PO Manager', 'Can create and manage purchase orders', false),
    ('Viewer', 'Read-only access to assigned modules', false)
ON CONFLICT (role_name) DO NOTHING;

-- Insert comprehensive permissions
INSERT INTO permissions (permission_name, category, description) VALUES 
    -- Admin & User Management
    ('users.view', 'admin', 'View users list'),
    ('users.create', 'admin', 'Create new users'),
    ('users.edit', 'admin', 'Edit user details'),
    ('users.delete', 'admin', 'Delete users'),
    ('users.manage_roles', 'admin', 'Assign roles to users'),
    ('roles.manage', 'admin', 'Manage roles and permissions'),
    
    -- Sidebar Navigation
    ('sidebar.dashboard', 'sidebar', 'View Dashboard in sidebar'),
    ('sidebar.inventory', 'sidebar', 'View Inventory section in sidebar'),
    ('sidebar.po', 'sidebar', 'View Purchase Orders section in sidebar'),
    ('sidebar.secondary_sales', 'sidebar', 'View Secondary Sales section in sidebar'),
    ('sidebar.reports', 'sidebar', 'View Reports section in sidebar'),
    ('sidebar.admin', 'sidebar', 'View Admin section in sidebar'),
    ('sidebar.settings', 'sidebar', 'View Settings section in sidebar'),
    
    -- Purchase Orders
    ('po.view', 'po', 'View purchase orders'),
    ('po.create', 'po', 'Create purchase orders'),
    ('po.edit', 'po', 'Edit purchase orders'),
    ('po.delete', 'po', 'Delete purchase orders'),
    ('po.approve', 'po', 'Approve purchase orders'),
    ('po.export', 'po', 'Export purchase order data'),
    
    -- Inventory Management
    ('inventory.view', 'inventory', 'View inventory'),
    ('inventory.upload', 'inventory', 'Upload inventory files'),
    ('inventory.edit', 'inventory', 'Edit inventory data'),
    ('inventory.reports', 'inventory', 'View inventory reports'),
    
    -- Secondary Sales
    ('secondary_sales.view', 'secondary_sales', 'View secondary sales data'),
    ('secondary_sales.upload', 'secondary_sales', 'Upload secondary sales files'),
    ('secondary_sales.edit', 'secondary_sales', 'Edit secondary sales data'),
    ('secondary_sales.reports', 'secondary_sales', 'View secondary sales reports'),
    
    -- Platform Access
    ('platform.amazon', 'platform', 'Access Amazon platform'),
    ('platform.flipkart', 'platform', 'Access Flipkart platform'),
    ('platform.zepto', 'platform', 'Access Zepto platform'),
    ('platform.blinkit', 'platform', 'Access Blinkit platform'),
    ('platform.swiggy', 'platform', 'Access Swiggy platform'),
    ('platform.bigbasket', 'platform', 'Access BigBasket platform'),
    ('platform.jiomart', 'platform', 'Access JioMart platform'),
    ('platform.all', 'platform', 'Access all platforms'),
    
    -- Reports & Analytics
    ('reports.view', 'reports', 'View reports'),
    ('reports.generate', 'reports', 'Generate custom reports'),
    ('reports.export', 'reports', 'Export reports'),
    ('analytics.view', 'analytics', 'View analytics dashboard')
ON CONFLICT (permission_name) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Admin gets most permissions except super admin functions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'Admin' 
    AND p.permission_name NOT IN ('roles.manage')
ON CONFLICT DO NOTHING;

-- Inventory Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'Inventory Manager' 
    AND (p.category = 'inventory' 
         OR p.permission_name IN ('sidebar.dashboard', 'sidebar.inventory', 'sidebar.reports', 'reports.view'))
ON CONFLICT DO NOTHING;

-- Secondary Sales Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'Secondary Sales Manager' 
    AND (p.category = 'secondary_sales' 
         OR p.permission_name IN ('sidebar.dashboard', 'sidebar.secondary_sales', 'sidebar.reports', 'reports.view'))
ON CONFLICT DO NOTHING;

-- PO Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'PO Manager' 
    AND (p.category = 'po' OR p.category = 'platform'
         OR p.permission_name IN ('sidebar.dashboard', 'sidebar.po', 'sidebar.reports', 'reports.view'))
ON CONFLICT DO NOTHING;

-- Viewer permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.role_name = 'Viewer' 
    AND p.permission_name LIKE '%.view'
    AND p.permission_name IN ('sidebar.dashboard', 'po.view', 'inventory.view', 'secondary_sales.view', 'reports.view')
ON CONFLICT DO NOTHING;

-- Create default super admin user (if users table exists and no admin exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if any admin user exists
        IF NOT EXISTS (SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE r.is_admin = true) THEN
            INSERT INTO users (username, email, password_hash, role_id, status, created_at)
            SELECT 
                'admin',
                'admin@jivomart.com',
                '$2b$10$rGVZ9Z9Z9Z9Z9Z9Z9Z9Z9eJ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z', -- Default: 'admin123'
                r.id,
                'active',
                NOW()
            FROM roles r 
            WHERE r.role_name = 'Super Admin'
            LIMIT 1;
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Verification query to see the setup
SELECT 
    r.role_name,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.permission_name, ', ' ORDER BY p.permission_name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.role_name
ORDER BY r.role_name;