#!/bin/bash

echo "========================================="
echo "555 Results - Live Server Update Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}This script must be run as root${NC}"
  echo "Usage: sudo ./update-live-server.sh"
  exit 1
fi

# Step 1: Create backup
echo -e "${YELLOW}Step 1: Creating backup...${NC}"
BACKUP_DIR="/var/www/555-app-backup-$(date +%Y%m%d-%H%M%S)"
if [ -d "/var/www/555-app" ]; then
    cp -r /var/www/555-app $BACKUP_DIR
    echo -e "${GREEN}Backup created at: $BACKUP_DIR${NC}"
else
    echo -e "${RED}Application directory not found at /var/www/555-app${NC}"
    exit 1
fi

# Step 2: Stop service
echo -e "${YELLOW}Step 2: Stopping application service...${NC}"
sudo systemctl stop 555-app.service
if systemctl is-active --quiet 555-app.service; then
    echo -e "${RED}Failed to stop service${NC}"
    exit 1
else
    echo -e "${GREEN}Service stopped successfully${NC}"
fi

# Step 3: Update code
echo -e "${YELLOW}Step 3: Updating application code...${NC}"
cd /var/www/555-app

# Check if git is available and repository exists
if [ -d ".git" ]; then
    echo "Updating from git repository..."
    git pull origin main
else
    echo "No git repository found. Please manually upload the updated files:"
    echo "- backend/utils/timezone.js"
    echo "- backend/routes/games.js"
    echo "- src/utils/timezone.ts"
    echo ""
    read -p "Press Enter after uploading the files..."
fi

# Step 4: Install dependencies
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install

# Step 5: Build frontend
echo -e "${YELLOW}Step 5: Building frontend...${NC}"
npm run build

# Step 6: Set permissions
echo -e "${YELLOW}Step 6: Setting permissions...${NC}"
chown -R www-data:www-data /var/www/555-app
chmod -R 755 /var/www/555-app

# Step 7: Start service
echo -e "${YELLOW}Step 7: Starting application service...${NC}"
sudo systemctl start 555-app.service

# Wait a moment for service to start
sleep 3

# Step 8: Verify service status
echo -e "${YELLOW}Step 8: Verifying service status...${NC}"
if systemctl is-active --quiet 555-app.service; then
    echo -e "${GREEN}✓ Service is running${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo "Checking logs..."
    sudo journalctl -u 555-app.service -n 10 --no-pager
    exit 1
fi

# Step 9: Test API
echo -e "${YELLOW}Step 9: Testing API endpoint...${NC}"
sleep 2
API_RESPONSE=$(curl -s http://localhost:3001/api/games)
if echo "$API_RESPONSE" | grep -q "localUpcoming"; then
    echo -e "${GREEN}✓ API is responding correctly${NC}"
else
    echo -e "${YELLOW}⚠ API response may need verification${NC}"
fi

# Step 10: Health check
echo -e "${YELLOW}Step 10: Performing health check...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check needs attention${NC}"
fi

echo ""
echo -e "${GREEN}========================================="
echo "Update Complete!"
echo "=========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test your website at your domain"
echo "2. Check if 'Upcoming Games' section shows data"
echo "3. Verify times are in IST format"
echo ""
echo -e "${YELLOW}If you encounter issues:${NC}"
echo "1. Check logs: sudo journalctl -u 555-app.service -f"
echo "2. Rollback: sudo rm -rf /var/www/555-app && sudo cp -r $BACKUP_DIR /var/www/555-app"
echo "3. Restart service: sudo systemctl start 555-app.service"
echo ""
echo -e "${GREEN}Backup location: $BACKUP_DIR${NC}"
echo ""