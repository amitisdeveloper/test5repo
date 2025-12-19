#!/bin/bash

echo "========================================="
echo "555 Results Application Deployment Script"
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
  echo "Usage: sudo ./deploy.sh"
  exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt update
apt upgrade -y

# Step 2: Install Node.js
echo -e "${YELLOW}Step 2: Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs npm
npm install -g pm2

# Step 3: Install Apache
echo -e "${YELLOW}Step 3: Installing Apache2...${NC}"
apt install -y apache2 apache2-utils certbot python3-certbot-apache

# Step 4: Enable Apache modules
echo -e "${YELLOW}Step 4: Enabling Apache modules...${NC}"
a2enmod ssl
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod headers
a2enmod proxy_balancer
a2enmod lbmethod_byrequests

# Step 5: Create application directory
echo -e "${YELLOW}Step 5: Setting up application directory...${NC}"
mkdir -p /var/www/555-app
cd /var/www/555-app

# Step 6: Install dependencies
echo -e "${YELLOW}Step 6: Installing Node dependencies...${NC}"
npm install

# Step 7: Build frontend
echo -e "${YELLOW}Step 7: Building React frontend...${NC}"
npm run build

# Step 8: Create environment file
echo -e "${YELLOW}Step 8: Creating environment configuration...${NC}"
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo -e "${YELLOW}Please edit .env with your MongoDB Atlas URI and JWT secret${NC}"
  echo "Command: nano /var/www/555-app/.env"
  read -p "Press Enter after updating .env..."
else
  echo -e "${GREEN}.env already exists${NC}"
fi

# Step 9: Set permissions
echo -e "${YELLOW}Step 9: Setting file permissions...${NC}"
chown -R www-data:www-data /var/www/555-app
chmod -R 755 /var/www/555-app

# Step 10: Copy systemd service
echo -e "${YELLOW}Step 10: Installing systemd service...${NC}"
cp 555-app.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable 555-app.service

# Step 11: Configure Apache
echo -e "${YELLOW}Step 11: Configuring Apache VirtualHost...${NC}"
read -p "Enter your domain name (e.g., example.com): " DOMAIN

cat > /etc/apache2/sites-available/555-app.conf <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem
    
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    
    ErrorLog \${APACHE_LOG_DIR}/555-error.log
    CustomLog \${APACHE_LOG_DIR}/555-access.log combined
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    <LocationMatch "\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "public, max-age=31536000"
    </LocationMatch>
    
    <LocationMatch "\.(html)$">
        Header set Cache-Control "public, max-age=0, must-revalidate"
    </LocationMatch>
</VirtualHost>
EOF

a2ensite 555-app.conf
a2dissite 000-default.conf

# Step 12: Get SSL certificate
echo -e "${YELLOW}Step 12: Obtaining SSL certificate...${NC}"
certbot --apache -d $DOMAIN -d www.$DOMAIN

# Step 13: Test Apache configuration
echo -e "${YELLOW}Step 13: Testing Apache configuration...${NC}"
apache2ctl configtest

# Step 14: Start services
echo -e "${YELLOW}Step 14: Starting services...${NC}"
systemctl restart apache2
systemctl start 555-app.service
systemctl status 555-app.service

echo ""
echo -e "${GREEN}========================================="
echo "Deployment Complete!"
echo "=========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create admin user:"
echo "   curl -X POST http://localhost:3001/api/auth/create-admin \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"admin\",\"password\":\"your-password\",\"email\":\"admin@example.com\"}'"
echo ""
echo "2. Check server status:"
echo "   systemctl status 555-app.service"
echo "   sudo tail -f /var/log/apache2/555-error.log"
echo ""
echo "3. Your application is running at: https://$DOMAIN"
echo ""
