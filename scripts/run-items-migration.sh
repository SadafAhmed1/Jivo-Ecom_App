#!/bin/bash

# Script to populate items table from HANA stored procedure
echo "========================================="
echo "  POPULATING ITEMS TABLE FROM HANA"
echo "========================================="
echo ""

# Check if server is running
echo "🔍 Checking if server is running on port 3000..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Server is not running. Please start the server first:"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Call the migration endpoint
echo "📞 Calling migration endpoint to populate items table..."
echo "This will:"
echo "  1. Call SP_GET_ITEM_DETAILS stored procedure"
echo "  2. Insert all data into PostgreSQL items table"
echo ""

response=$(curl -X POST http://localhost:3000/api/migrate-items \
    -H "Content-Type: application/json" \
    -s -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n 1)
json_response=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Response:"
    echo "$json_response" | jq '.'
    echo ""
    echo "🎉 Items table is now populated!"
    echo ""
    echo "You can verify the data with:"
    echo "  psql -h 103.89.44.240 -U postgres -d ecom -c 'SELECT COUNT(*) FROM items;'"
    echo "  psql -h 103.89.44.240 -U postgres -d ecom -c 'SELECT * FROM items LIMIT 10;'"
else
    echo "❌ Migration failed with HTTP code: $http_code"
    echo "Response:"
    echo "$json_response" | jq '.'
    exit 1
fi