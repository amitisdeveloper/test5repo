#!/bin/bash

# 555 Results App - Ubuntu Apache Deployment Script
# This script automates the deployment of the 555 Results app on Ubuntu with Apache

set -e  # Exit on any error

# Configuration
APP_NAME="555results"
APP_DIR="/opt/$APP_NAME"
APP_USER="www-data"
DOMAIN=${1:-"yourdomain.com"}
GIT_REPO=${2:-""}  # Optional Git repository URL

echo "🚀 Starting deployment of 555 Results App..."
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Apache
echo "📦 Installing Apache..."
sudo apt install -y apache2

# Enable required Apache modules
echo "🔧 Enabling Apache modules..."
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires

# Install Certbot for SSL
echo "📦 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-apache

# Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:$APP_USER $APP_DIR

# Clone or copy application files
if [ ! -z "$GIT_REPO" ]; then
    echo "📥 Cloning repository from $GIT_REPO..."
    sudo git clone $GIT_REPO $APP_DIR
else
    echo "📥 Please copy your application files to $APP_DIR manually"
    echo "Or update this script with your Git repository URL"
    exit 1
fi

# Install dependencies
echo "📦 Installing application dependencies..."
cd $APP_DIR
sudo npm install --production

# Build frontend
echo "🏗️  Building frontend..."
sudo npm run build

# Copy .htaccess to dist
echo "📁 Setting up .htaccess..."
sudo cp public/.htaccess dist/.htaccess

# Create production environment file
echo "🔧 Creating production environment..."
sudo tee $APP_DIR/.env > /dev/null <<EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://$DOMAIN
VITE_API_URL=https://$DOMAIN
LOG_LEVEL=info
EOF

# Update Apache virtual host configuration
echo "🔧 Configuring Apache virtual host..."
sudo tee /etc/apache2/sites-available/$APP_NAME.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    # SSL Configuration (will be updated by certbot)
    SSLEngine on
    # Certbot will update these paths
    
    # Document root - React build files
    DocumentRoot $APP_DIR/dist
    
    # Logging
    ErrorLog \${APACHE_LOG_DIR}/$APP_NAME-error.log
    CustomLog \${APACHE_LOG_DIR}/$APP_NAME-access.log combined
    
    # Proxy Configuration - API requests only
    ProxyPreserveHost On
    ProxyRequests Off
    
    # API requests - proxy to Node.js backend
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
    
    # WebSocket support (if needed)
    ProxyPass /ws ws://localhost:3001/ws
    ProxyPassReverse /ws ws://localhost:3001/ws
    
    # Serve React static files with proper caching
    <Directory $APP_DIR/dist>
        Options -Indexes
        AllowOverride All
        Require all granted
        
        # Enable compression for text files
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Directory>
    
    # Security headers for all responses
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</VirtualHost>
EOF

# Enable the site
echo "🔧 Enabling Apache site..."
sudo a2ensite $APP_NAME.conf
sudo a2dissite 000-default.conf

# Create PM2 ecosystem file if it doesn't exist
echo "🔧 Setting up PM2..."
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    sudo cp ecosystem.config.js $APP_DIR/
fi

# Start PM2 process
echo "🚀 Starting application with PM2..."
cd $APP_DIR
sudo pm2 start ecosystem.config.js --env production
sudo pm2 save
sudo pm2 startup

# Restart Apache
echo "🔄 Restarting Apache..."
sudo systemctl restart apache2

# Enable Apache to start on boot
echo "🔧 Enabling Apache to start on boot..."
sudo systemctl enable apache2

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R $APP_USER:$APP_USER $APP_DIR
sudo chmod -R 755 $APP_DIR

echo "✅ Basic deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update MongoDB connection string in $APP_DIR/.env"
echo "2. Get SSL certificate: sudo certbot --apache -d $DOMAIN"
echo "3. Test your application: https://$DOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "View logs: sudo pm2 logs $APP_NAME"
echo "Restart app: sudo pm2 restart $APP_NAME"
echo "Check status: sudo pm2 status"
echo "View Apache logs: sudo tail -f /var/log/apache2/$APP_NAME-error.log"