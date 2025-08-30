# Database Connection Guide

## Issue
The application is configured to connect to a remote PostgreSQL database at `103.89.44.240:5432`, but this server is currently unreachable (ENETUNREACH error).

## Current Status
- **Remote Database**: `103.89.44.240:5432` - ❌ Not reachable
- **Local Database**: No local PostgreSQL instance available
- **Error Handling**: ✅ Enhanced with better user messages

## Solutions

### Option 1: Fix Remote Database Connection
1. Check if the database server at `103.89.44.240` is running
2. Verify network connectivity to that IP address
3. Check firewall rules that might be blocking port 5432
4. Contact the database administrator

### Option 2: Use Local Development Database
1. Install PostgreSQL locally:
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. Create local database:
   ```bash
   createdb ecommerce_db
   ```

3. Update `.env` to use local database:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_db
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

### Option 3: Use Alternative Database Service
Consider using a cloud database service like:
- Neon (Serverless PostgreSQL)
- Supabase
- Railway PostgreSQL
- Render PostgreSQL

## Current Error Handling
The PF Item Picker component now includes:
- ✅ Better error messages for connection issues
- ✅ Retry functionality
- ✅ User-friendly error display
- ✅ Timeout handling for slow connections

## Temporary Workaround
The application will continue to show proper error messages when the database is unreachable, allowing users to understand what's happening instead of seeing generic errors.

## Files Modified
- `client/src/components/po/pf-item-picker.tsx`: Enhanced error handling for database connection issues
- `client/src/components/po/modern-po-form.tsx`: Fixed tax rate field mapping consistency 
- `client/src/components/po/line-item-row.tsx`: Fixed tax rate display and calculations