#!/bin/bash

echo "🚀 Deploying Jivo Ecom Operations to GitHub Pages..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh-pages is installed
if ! npm list gh-pages --depth=0 >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing gh-pages...${NC}"
    npm install --save-dev gh-pages
fi

# Build the project
echo -e "${YELLOW}Building project for production...${NC}"
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
else
    echo -e "${RED}✗ Build failed. Please check the errors above.${NC}"
    exit 1
fi

# Create 404.html for client-side routing
cp ./dist/public/index.html ./dist/public/404.html
echo -e "${GREEN}✓ Created 404.html for routing${NC}"

# Deploy to GitHub Pages
echo -e "${YELLOW}Deploying to GitHub Pages...${NC}"
npx gh-pages -d dist/public

if [ $? -eq 0 ]; then
    echo -e "${GREEN}=================================================="
    echo -e "✓ Deployment successful!${NC}"
    echo -e "${GREEN}=================================================="
    echo ""
    echo "Your site will be live at:"
    echo -e "${GREEN}https://sadafqureshia.github.io/jivo_ecom_po/${NC}"
    echo ""
    echo "Note: It may take a few minutes for changes to appear."
else
    echo -e "${RED}✗ Deployment failed. Please check your GitHub authentication.${NC}"
    echo ""
    echo "Try one of these solutions:"
    echo "1. Add SadafAhmed1 as a collaborator to the repository"
    echo "2. Use a personal access token"
    echo "3. Clear your Git credentials and re-authenticate"
fi