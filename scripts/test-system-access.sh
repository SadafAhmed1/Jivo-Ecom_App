#!/bin/bash

echo "=== Enhanced Terminal System Access Test ==="
echo ""

echo "📁 Current Directory:"
pwd
echo ""

echo "💻 System Information:"
echo "Platform: $(uname -s)"
echo "Architecture: $(uname -m)"
echo "Hostname: $(hostname)"
echo ""

echo "🌐 Network Connectivity:"
echo "Testing internet connection..."
ping -c 3 google.com > /dev/null 2>&1 && echo "✅ Internet: Connected" || echo "❌ Internet: Disconnected"
echo ""

echo "📊 System Resources:"
echo "Disk usage:"
df -h | head -5
echo ""
echo "Memory usage:"
free -h 2>/dev/null || echo "Memory info not available on this system"
echo ""

echo "🔧 Development Tools:"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')" 
echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"
echo "Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
echo "curl: $(curl --version 2>/dev/null | head -1 || echo 'Not installed')"
echo ""

echo "📋 Environment Variables (Project-related):"
echo "DATABASE_URL: ${DATABASE_URL:+[SET]} ${DATABASE_URL:-[NOT SET]}"
echo "PROJECT_ROOT: ${PROJECT_ROOT:-$(pwd)}"
echo ""

echo "🗂️  Project Structure:"
echo "Files in current directory:"
ls -la | head -10
echo ""

echo "🚀 System Access Test Complete!"
echo "This terminal has full system access and can run any command."
echo ""
echo "Try these commands:"
echo "• ls -la                 (list files with details)"
echo "• ps aux                 (running processes)"
echo "• git status             (git repository status)"
echo "• npm run dev            (run development server)"
echo "• curl ifconfig.me       (get public IP)"
echo "• cat package.json       (view project config)"