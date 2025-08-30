#!/bin/bash

# Test script for three-level cascading dropdown endpoints
# This demonstrates the proper region -> state -> district flow

echo "🌍 Testing Three-Level Cascading Dropdown System"
echo "================================================"

BASE_URL="http://127.0.0.1:5000"

echo ""
echo "1. 🌍 Testing /api/regions endpoint:"
echo "-----------------------------------"
curl -s "$BASE_URL/api/regions" | jq '.' || echo "No JSON response or server not running"

echo ""
echo "2. 🏛️ Testing /api/states/by-region/1 (NORTH INDIA):"
echo "----------------------------------------------------"
curl -s "$BASE_URL/api/states/by-region/1" | jq '.' || echo "No JSON response"

echo ""
echo "3. 🏛️ Testing /api/states/by-region/2 (SOUTH INDIA):"
echo "----------------------------------------------------"
curl -s "$BASE_URL/api/states/by-region/2" | jq '.' || echo "No JSON response"

echo ""
echo "4. 🏘️ Testing /api/districts/by-state/3 (DELHI districts):"
echo "----------------------------------------------------------"
curl -s "$BASE_URL/api/districts/by-state/3" | jq '.' || echo "No JSON response"

echo ""
echo "5. 🏘️ Testing /api/districts/by-state/1 (KARNATAKA districts):"
echo "--------------------------------------------------------------"
curl -s "$BASE_URL/api/districts/by-state/1" | jq '.' || echo "No JSON response"

echo ""
echo "Expected Flow:"
echo "- Select 'NORTH INDIA' region -> Shows only DELHI, HARYANA, PUNJAB, UTTAR PRADESH"
echo "- Select 'DELHI' state -> Shows only Delhi districts (CENTRAL, EAST, NEW DELHI, etc.)"
echo "- Select 'SOUTH INDIA' region -> Shows only KARNATAKA, TAMIL NADU, KERALA, ANDHRA PRADESH"
echo "- Select 'KARNATAKA' state -> Shows only Karnataka districts"
echo ""
echo "Database Setup Required:"
echo "1. Run: seed-test-regions-data.sql (creates regions table and assigns test states)"
echo "2. Verify foreign key relationships are working"
echo "3. Ensure region_id values are properly set in states table"