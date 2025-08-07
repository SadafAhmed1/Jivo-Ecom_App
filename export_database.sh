#!/bin/bash

# Create export directory
mkdir -p database_exports

echo "Exporting database..."

# Export full database as SQL dump
echo "Creating SQL dump..."
pg_dump $DATABASE_URL > database_exports/full_database.sql

# Export individual tables as CSV
echo "Exporting tables as CSV..."

# Platform Master
psql $DATABASE_URL -c "COPY (SELECT * FROM pf_mst) TO STDOUT WITH CSV HEADER;" > database_exports/platforms.csv

# SAP Item Master
psql $DATABASE_URL -c "COPY (SELECT * FROM sap_item_mst) TO STDOUT WITH CSV HEADER;" > database_exports/sap_items.csv

# Platform Item Master
psql $DATABASE_URL -c "COPY (SELECT * FROM pf_item_mst) TO STDOUT WITH CSV HEADER;" > database_exports/platform_items.csv

# Platform PO
psql $DATABASE_URL -c "COPY (SELECT * FROM pf_po) TO STDOUT WITH CSV HEADER;" > database_exports/platform_pos.csv

# Platform Order Items
psql $DATABASE_URL -c "COPY (SELECT * FROM pf_order_items) TO STDOUT WITH CSV HEADER;" > database_exports/platform_order_items.csv

# Flipkart Grocery POs
psql $DATABASE_URL -c "COPY (SELECT * FROM flipkart_grocery_po_header) TO STDOUT WITH CSV HEADER;" > database_exports/flipkart_po_headers.csv
psql $DATABASE_URL -c "COPY (SELECT * FROM flipkart_grocery_po_lines) TO STDOUT WITH CSV HEADER;" > database_exports/flipkart_po_lines.csv

# Zepto POs
psql $DATABASE_URL -c "COPY (SELECT * FROM zepto_po_header) TO STDOUT WITH CSV HEADER;" > database_exports/zepto_po_headers.csv
psql $DATABASE_URL -c "COPY (SELECT * FROM zepto_po_lines) TO STDOUT WITH CSV HEADER;" > database_exports/zepto_po_lines.csv

# City Mall POs
psql $DATABASE_URL -c "COPY (SELECT * FROM city_mall_po_header) TO STDOUT WITH CSV HEADER;" > database_exports/city_mall_po_headers.csv
psql $DATABASE_URL -c "COPY (SELECT * FROM city_mall_po_lines) TO STDOUT WITH CSV HEADER;" > database_exports/city_mall_po_lines.csv

# Blinkit POs
psql $DATABASE_URL -c "COPY (SELECT * FROM blinkit_po_header) TO STDOUT WITH CSV HEADER;" > database_exports/blinkit_po_headers.csv
psql $DATABASE_URL -c "COPY (SELECT * FROM blinkit_po_lines) TO STDOUT WITH CSV HEADER;" > database_exports/blinkit_po_lines.csv

# Swiggy POs
psql $DATABASE_URL -c "COPY (SELECT * FROM swiggy_pos) TO STDOUT WITH CSV HEADER;" > database_exports/swiggy_po_headers.csv
psql $DATABASE_URL -c "COPY (SELECT * FROM swiggy_po_lines) TO STDOUT WITH CSV HEADER;" > database_exports/swiggy_po_lines.csv

# Users table
psql $DATABASE_URL -c "COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;" > database_exports/users.csv

echo "Export completed! Files available in database_exports/ directory:"
ls -la database_exports/

echo ""
echo "Files created:"
echo "1. full_database.sql - Complete database dump (can be restored with psql)"
echo "2. Individual CSV files for each table"
echo ""
echo "To download these files:"
echo "1. You can download them from the Files panel in Replit"
echo "2. Or use the shell to zip them: tar -czf database_backup.tar.gz database_exports/"