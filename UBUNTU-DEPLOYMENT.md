# Ubuntu Deployment Guide

This guide covers deploying the 555 Results application on Ubuntu with Apache, MongoDB Atlas, and Node.js.

## Prerequisites

- Ubuntu 20.04 LTS or later
- Root or sudo access
- A domain name (optional but recommended)
- MongoDB Atlas account with connection string
- Node.js 16+ (will be installed)

## Step 1: Initial Setup

### 1.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Dependencies
```bash
sudo apt install -y curl git wget build-essential

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

sudo npm install -g pm2
```

### 1.3 Install Apache and SSL
```bash
sudo apt install -y apache2 apache2-utils
sudo apt install -y certbot python3-certbot-apache
```

### 1.4 Enable Apache Modules
```bash
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
```

## Step 2: Application Setup

### 2.1 Clone/Deploy Application
```bash
sudo mkdir -p /var/www/555-app
sudo chown $USER:$USER /var/www/555-app
cd /var/www/555-app

git clone <your-repo-url> .
# Or upload your files
```

### 2.2 Install Dependencies
```bash
cd /var/www/555-app
npm install
```

### 2.3 Build React Frontend
```bash
npm run build
```

### 2.4 Create Production Environment File
```bash
sudo nano .env
```

Add the following (update with your values):
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority
JWT_SECRET=<generate with: openssl rand -hex 32>
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
```

### 2.5 Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app
```

## Step 3: Configure Node.js as Service

### 3.1 Copy Service File
```bash
sudo cp /var/www/555-app/555-app.service /etc/systemd/system/
```

### 3.2 Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable 555-app.service
sudo systemctl start 555-app.service
sudo systemctl status 555-app.service
```

Check logs:
```bash
sudo journalctl -u 555-app.service -f
```

## Step 4: Configure Apache

### 4.1 Configure Apache VirtualHost
```bash
sudo nano /etc/apache2/sites-available/555-app.conf
```

Add the configuration (update domain):
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    
    ErrorLog ${APACHE_LOG_DIR}/555-error.log
    CustomLog ${APACHE_LOG_DIR}/555-access.log combined
    
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
```

### 4.2 Enable Site
```bash
sudo a2ensite 555-app.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest
```

Should output: `Syntax OK`

### 4.3 Get SSL Certificate
```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### 4.4 Restart Apache
```bash
sudo systemctl restart apache2
```

## Step 5: Setup MongoDB Atlas

### 5.1 Create MongoDB Atlas Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up and create an account
- Create a new project

### 5.2 Create a Cluster
- Create M0 (free) cluster
- Choose your region
- Configure security (allow access from your server IP)

### 5.3 Create Database User
- Create a database user with username and password
- Generate connection string
- Add it to your `.env` file

### 5.4 Add IP Whitelist
- Go to Network Access
- Add your server's public IP
- Or allow 0.0.0.0/0 (less secure but works for development)

## Step 6: Create Initial Admin User

```bash
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password","email":"admin@example.com"}'
```

Or visit: `https://yourdomain.com/admin/login` and create through the UI if the endpoint is available.

## Step 7: Verification

### 7.1 Check Health Endpoint
```bash
curl https://yourdomain.com/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "connected",
  "environment": "production"
}
```

### 7.2 Check Logs
```bash
sudo journalctl -u 555-app.service -f
sudo tail -f /var/log/apache2/555-error.log
```

## Maintenance

### Backup Database
```bash
mongodump --uri="your-mongodb-atlas-uri" --out=/backups/mongodb-backup
```

### Update Application
```bash
cd /var/www/555-app
git pull origin main
npm install
npm run build
sudo systemctl restart 555-app.service
```

### Renew SSL Certificate (automatic with certbot)
```bash
sudo certbot renew --dry-run
```

### View Service Status
```bash
sudo systemctl status 555-app.service
sudo systemctl restart 555-app.service
sudo systemctl stop 555-app.service
sudo systemctl start 555-app.service
```

## Troubleshooting

### Service Won't Start
```bash
sudo journalctl -u 555-app.service -n 50
```

### MongoDB Connection Issues
- Verify connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Verify credentials are correct

### Apache Proxy Issues
```bash
sudo apache2ctl configtest
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

### Port Already in Use
```bash
sudo lsof -i :3001
```

### File Permissions Issues
```bash
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app
```

## Performance Tuning

### Enable Gzip Compression
Add to Apache config:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Increase Connection Pool
Edit `.env`:
```env
MONGODB_POOL_SIZE=10
```

### Monitor Performance
```bash
top
free -h
df -h
sudo journalctl -u 555-app.service --since "1 hour ago"
```

## Security Recommendations

1. Use strong JWT_SECRET (generate: `openssl rand -hex 32`)
2. Keep MongoDB Atlas IP whitelist restricted
3. Use HTTPS only
4. Enable HSTS header in Apache
5. Regularly update Node.js and dependencies
6. Setup automated backups
7. Monitor error logs regularly
