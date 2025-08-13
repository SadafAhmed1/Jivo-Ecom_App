# Local Development Setup Guide

## Prerequisites
1. Node.js 18+ installed
2. PostgreSQL 14+ installed locally
3. Git for version control

## Database Setup

### 1. Install PostgreSQL locally
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. Create Database and User
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE ecommerce_db;

-- Create user (optional)
CREATE USER ecom_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecom_user;

-- Exit
\q
```

### 3. Environment Variables
Set these environment variables in your system or create a .env file:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=ecommerce_db

# Session Configuration - IMPORTANT: Change in production
SESSION_SECRET=local-dev-session-secret-key-change-in-production-minimum-32-characters

# Server Configuration
NODE_ENV=development
PORT=5000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

## Project Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd <project-directory>
npm install
```

### 2. Database Migration
```bash
# Push database schema to local PostgreSQL
npm run db:push

# Or if you have existing data, export from Replit and import:
# pg_dump $DATABASE_URL > database_export.sql
# psql -h localhost -U postgres -d ecommerce_db -f database_export.sql
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Data Migration from Replit

If you need to migrate data from your Replit database to local:

### Export from Replit
```bash
# In Replit terminal
pg_dump $DATABASE_URL > database_backup.sql
```

### Import to Local
```bash
# Download the backup file and run locally
psql -h localhost -U postgres -d ecommerce_db -f database_backup.sql
```

## Local Development Benefits

1. **No Connection Limits**: No Neon serverless connection issues
2. **Faster Queries**: Local database responses
3. **Offline Development**: Work without internet
4. **Full Control**: Complete database access and configuration
5. **Better Debugging**: Direct access to PostgreSQL logs

## Troubleshooting

### Common Issues

1. **PostgreSQL not starting**
   ```bash
   # Check status
   sudo systemctl status postgresql
   
   # Start service
   sudo systemctl start postgresql
   ```

2. **Permission denied for user**
   ```sql
   -- Grant permissions
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
   ```

3. **Port already in use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

4. **Database connection refused**
   - Check if PostgreSQL is running
   - Verify connection parameters
   - Check firewall settings

## Production Deployment

For production deployment, remember to:
1. Use strong SESSION_SECRET
2. Set up proper database backups
3. Configure SSL for database connections
4. Set up monitoring and logging
5. Use environment-specific configurations