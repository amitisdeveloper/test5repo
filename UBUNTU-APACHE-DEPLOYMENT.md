# Ubuntu Apache Deployment Guide

This guide covers deploying the 555 Results app on Ubuntu with Apache, PM2, and MongoDB Atlas.

## Prerequisites

- Ubuntu 20.04+ server
- Root or sudo access
- Domain name pointing to your server
- MongoDB Atlas account

## Quick Deployment

### Automated Deployment (Recommended)

1. **Copy your application to the server:**
   ```bash
   # On your local machine, copy the project to server
   scp -r . user@your-server:/tmp/555results/
   ```

2. **Run the deployment script:**
   ```bash
   # On your Ubuntu server
   chmod +x scripts/deploy-ubuntu.sh
   sudo ./scripts/deploy-ubuntu.sh yourdomain.com https://github.com/yourusername/555results.git
   ```

### Manual Deployment

If you prefer manual setup, follow these steps:

#### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Apache
sudo apt install -y apache2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-apache

# Enable Apache modules
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires
```

#### 2. Setup Application

```bash
# Create app directory
sudo mkdir -p /opt/555results
sudo chown www-data:www-data /opt/555results

# Copy application files
sudo cp -r * /opt/555results/
cd /opt/555results

# Install dependencies
sudo npm install --production

# Build frontend
sudo npm run build

# Copy .htaccess to dist
sudo cp public/.htaccess dist/.htaccess
```

#### 3. Configure Environment

```bash
# Create production environment
sudo nano /opt/555results/.env
```

Add your production variables:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
LOG_LEVEL=info
```

#### 4. Configure Apache

Create virtual host file:
```bash
sudo nano /etc/apache2/sites-available/555results.conf
```

Add this configuration:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    # SSL Configuration (will be updated by certbot)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/yourdomain.com/chain.pem
    
    # Document root - React build files
    DocumentRoot /opt/555results/dist
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/555results-error.log
    CustomLog ${APACHE_LOG_DIR}/555results-access.log combined
    
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
    <Directory /opt/555results/dist>
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
```

Enable the site:
```bash
sudo a2ensite 555results.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

#### 5. Start Application with PM2

```bash
cd /opt/555results
sudo pm2 start ecosystem.config.js --env production
sudo pm2 save
sudo pm2 startup
```

#### 6. Setup SSL Certificate

```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

#### 7. Set Permissions

```bash
sudo chown -R www-data:www-data /opt/555results
sudo chmod -R 755 /opt/555results
```

## Post-Deployment

### Verify Deployment

1. **Check application status:**
   ```bash
   sudo pm2 status
   sudo pm2 logs 555results-api
   ```

2. **Check Apache status:**
   ```bash
   sudo systemctl status apache2
   sudo tail -f /var/log/apache2/555results-error.log
   ```

3. **Test endpoints:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

### Useful Commands

```bash
# PM2 Commands
sudo pm2 status                    # View all processes
sudo pm2 restart 555results-api   # Restart the app
sudo pm2 logs 555results-api      # View logs
sudo pm2 monit                     # Monitor processes

# Apache Commands
sudo systemctl status apache2      # Check Apache status
sudo systemctl restart apache2     # Restart Apache
sudo apache2ctl configtest         # Test configuration
sudo tail -f /var/log/apache2/555results-error.log  # View error logs

# MongoDB Test
curl -X POST https://yourdomain.com/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if PM2 process is running: `sudo pm2 status`
   - Check backend logs: `sudo pm2 logs 555results-api`
   - Verify MongoDB connection in logs

2. **API requests returning 404**
   - Ensure Apache proxy modules are enabled
   - Check Apache error logs
   - Verify backend is running on port 3001

3. **Frontend not loading**
   - Check if dist folder exists: `ls -la /opt/555results/dist/`
   - Verify Apache document root configuration
   - Check .htaccess file permissions

4. **SSL certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

### Log Locations

- PM2 Logs: `/opt/555results/logs/`
- Apache Error Log: `/var/log/apache2/555results-error.log`
- Apache Access Log: `/var/log/apache2/555results-access.log`
- PM2 Process Log: `sudo pm2 logs 555results-api`

### Performance Optimization

1. **Enable Gzip compression** (already configured)
2. **Set up log rotation:**
   ```bash
   sudo nano /etc/logrotate.d/555results
   ```
   
   Add:
   ```
   /var/log/apache2/555results-*.log {
       weekly
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 640 root adm
   }
   ```

3. **Monitor resources:**
   ```bash
   htop                    # System resources
   sudo pm2 monit         # Application monitoring
   ```

## Security Considerations

1. **Firewall Configuration:**
   ```bash
   sudo ufw allow 22      # SSH
   sudo ufw allow 80      # HTTP
   sudo ufw allow 443     # HTTPS
   sudo ufw enable
   ```

2. **Fail2Ban (Optional):**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   sudo pm2 update
   ```

## Backup

### Application Backup
```bash
# Create backup script
sudo nano /opt/backup-app.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/555results-$DATE.tar.gz /opt/555results

# Keep only last 7 days of backups
find $BACKUP_DIR -name "555results-*.tar.gz" -mtime +7 -delete
```

Make executable and schedule:
```bash
sudo chmod +x /opt/backup-app.sh
sudo crontab -e
# Add: 0 2 * * * /opt/backup-app.sh
```

## Migration from Development

If migrating from a development setup:

1. **Export development data** (if needed):
   ```bash
   mongodump --uri="mongodb://localhost:27017/555results"
   ```

2. **Import to MongoDB Atlas**:
   ```bash
   mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/555results" dump/
   ```

3. **Update production environment** with MongoDB Atlas connection string.

This completes the Apache-based deployment guide for Ubuntu!