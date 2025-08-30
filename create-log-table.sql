-- Create log_master table for tracking user edits
CREATE TABLE IF NOT EXISTS log_master (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_log_master_username ON log_master(username);
CREATE INDEX IF NOT EXISTS idx_log_master_table_record ON log_master(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_log_master_timestamp ON log_master(timestamp);