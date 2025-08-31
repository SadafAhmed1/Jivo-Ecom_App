#!/bin/bash

echo "🌐 Starting local preview server..."
echo "===================================="
echo ""
echo "Your site will be available at:"
echo "http://localhost:8080/jivo_ecom_po/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start a simple HTTP server with the correct base path
cd dist/public && python3 -m http.server 8080 --bind 127.0.0.1