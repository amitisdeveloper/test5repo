# Deployment Guide

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Local Development with Both Frontend & Backend

**Option A: Run Everything Together (Recommended)**
```bash
npm run dev:enhanced
```
This runs:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`
- Frontend proxies API calls to backend via Vite

**Option B: Run Separately**
```bash
# Terminal 1 - Backend
npm run server:enhanced

# Terminal 2 - Frontend
npm run dev
```

### 3. Create Admin User (First Time Only)
Frontend opens on `http://localhost:5173`. The backend automatically creates an admin user if none exists:
- Username: `admin`
- Password: `admin123`

---

## Production Setup (Ubuntu Server)

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account or MongoDB service

### Step 1: Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority`

### Step 2: Clone & Setup Project

```bash
cd /opt
git clone <your-repo> 555results
cd 555results
npm install
```

### Step 3: Configure Environment

Create `.env` file:

```bash
nano .env
```

Add the following (replace with your values):

```env
NODE_ENV=production

# Backend Server
PORT=3001

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority

# Generate strong JWT secret
JWT_SECRET=your-long-random-secret-key-here

# Your frontend URL
FRONTEND_URL=https://yourdomain.com
```

### Step 4: Build Frontend

```bash
npm run build
```

### Step 5: Setup as SystemD Service

Create `/etc/systemd/system/555results.service`:

```ini
[Unit]
Description=555 Results API Server
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/555results
ExecStart=/usr/bin/node server-enhanced.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/555results.log
StandardError=append:/var/log/555results.log

[Install]
WantedBy=multi-user.target
```

### Step 6: Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable 555results
sudo systemctl start 555results
sudo systemctl status 555results
```

### Step 7: Setup Nginx Reverse Proxy

Create `/etc/nginx/sites-available/555results`:

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Serve static frontend
    location / {
        root /opt/555results/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 8: Setup SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

### Step 9: Enable Nginx

```bash
sudo ln -s /etc/nginx/sites-available/555results /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Environment Variables Reference

| Variable | Local | Production | Example |
|----------|-------|------------|---------|
| `NODE_ENV` | `development` | `production` | - |
| `PORT` | `3001` | `3001` | - |
| `MONGODB_URI` | `mongodb://localhost:27017/555results` | `mongodb+srv://user:pass@cluster.mongodb.net/555results` | - |
| `JWT_SECRET` | `dev-secret-key-change-this-in-production` | Strong random string (min 32 chars) | - |
| `FRONTEND_URL` | `http://localhost:5173` | `https://yourdomain.com` | - |

---

## Monitoring & Debugging

### Check Service Status
```bash
sudo systemctl status 555results
```

### View Logs
```bash
# Real-time logs
sudo tail -f /var/log/555results.log

# Last 100 lines
sudo tail -100 /var/log/555results.log
```

### Restart Service
```bash
sudo systemctl restart 555results
```

### Test API Endpoint
```bash
curl -X GET http://localhost:3001/api/health
```

---

## Local to Production Checklist

- [ ] Environment variables configured (especially JWT_SECRET)
- [ ] MongoDB Atlas cluster created and connection tested
- [ ] Frontend built (`npm run build`)
- [ ] Backend started and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] SystemD service created and running
- [ ] Logs monitored for errors
- [ ] Admin user created in production
- [ ] CORS settings match production domain
