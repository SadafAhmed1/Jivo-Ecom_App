# Fix Status Tables in Edit Page

## Issue
Status values are not loading in the edit page because the status tables don't exist in the database.

## Solution Steps

### 1. Complete Database Migration
Run this command and choose the appropriate option:
```bash
npm run db:push
```

**Choose one of these options:**
- If you have an existing `status_items` table → Choose `~ status_items › status_item rename table`  
- If you want to create new tables → Choose `+ status_item create table`

### 2. Seed the Status Tables
After migration completes, seed the data:
```bash
curl -X POST http://127.0.0.1:5000/api/seed-status-tables
```

### 3. Test the APIs
Verify the endpoints return data:
```bash
curl http://127.0.0.1:5000/api/statuses
curl http://127.0.0.1:5000/api/status-items  
```

### 4. Expected Result
Both status dropdowns in the edit page should now load:
- **PO Status** → from `statuses` table
- **Item Status** → from `status_item` table

## Verification
✅ PO Status dropdown shows: OPEN, CLOSED, CANCELLED, EXPIRED, DUPLICATE, INVOICED  
✅ Item Status dropdown shows: PENDING, DISPATCHED, DELIVERED, INVOICED, CANCELLED, etc.
✅ Dynamic fields appear based on item status (invoice fields, dispatch date, delivery date)