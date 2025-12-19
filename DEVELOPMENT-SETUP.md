# Development Setup Guide

## Directory Structure

```
new555v2/
├── backend/              # Backend API (Express.js)
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Main server file
│   ├── package.json
│   └── .env             # Backend config (local development)
├── src/                 # React frontend
│   ├── components/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── .env                 # Frontend dev config
├── .env.production      # Production config
├── vite.config.ts       # Vite config with proxy settings
└── package.json         # Frontend dependencies
```

## Running Locally (Development)

### Prerequisites
- Node.js installed
- MongoDB running locally on `mongodb://localhost:27017/555results`

### Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm install
npm start
```

Expected output:
```
Server running on port 3001 in development mode
Connected to MongoDB: mongodb://localhost:27017/555results
```

### Step 2: Start Frontend (Terminal 2)

```bash
npm install
npm run dev
```

Expected output:
```
VITE v... ready in ... ms

➜ Local: http://localhost:5173/
```

### Configuration Files

**`.env` (Development)**
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=dev-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

## Running on Production Server (https://result.555xch.pro)

### Step 1: Prepare Server Environment

Create `.env.production` on your server:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results    # or MongoDB Atlas URL
JWT_SECRET=your-strong-random-secret-here
FRONTEND_URL=https://result.555xch.pro
VITE_API_URL=https://result.555xch.pro
```

### Step 2: Build Frontend

```bash
npm install
VITE_API_URL=https://result.555xch.pro npm run build
```

This creates optimized build in `dist/` folder.

### Step 3: Deploy Backend

```bash
cd backend
npm install
NODE_ENV=production npm start
```

### Step 4: Configure Web Server (Apache/Nginx)

The backend runs on port 3001 internally. Configure your web server to:

1. **Serve static frontend files** from `dist/` folder
2. **Proxy API requests** from `/api/*` to `http://localhost:3001/api/*`

**Apache Configuration Example:**
```apache
# Enable proxy modules
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite

# Virtual host config
<VirtualHost *:443>
    ServerName result.555xch.pro
    SSLEngine on
    SSLCertificateFile /path/to/cert.crt
    SSLCertificateKeyFile /path/to/key.key

    # Serve frontend files
    DocumentRoot /var/www/new555v2/dist
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
    
    # Fallback to index.html for SPA routing
    <Directory /var/www/new555v2/dist>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Step 5: Start Services

```bash
# Terminal 1: Backend
cd backend
NODE_ENV=production npm start

# Terminal 2: Check frontend is served
# (Usually handled by systemd/supervisor/PM2)
```

## API Endpoint Reference

All endpoints are prefixed with `/api`

### Development
- Local: `http://localhost:3001/api`
- Frontend proxy: `http://localhost:5173/api`

### Production
- Server: `https://result.555xch.pro/api`

### Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "connected",
  "environment": "development"
}
```

## Environment Variables Explained

| Variable | Dev | Prod | Purpose |
|----------|-----|------|---------|
| `NODE_ENV` | `development` | `production` | Node environment mode |
| `PORT` | `3001` | `3001` | Backend port (behind reverse proxy) |
| `MONGODB_URI` | `mongodb://localhost:27017/555results` | Atlas URI or local | Database connection |
| `JWT_SECRET` | Dev key | Strong random key | Token signing secret |
| `FRONTEND_URL` | `http://localhost:5173` | `https://result.555xch.pro` | CORS origin |
| `VITE_API_URL` | `http://localhost:3001` | `https://result.555xch.pro` | Frontend API base URL |

## Troubleshooting

### Backend connection refused
```bash
# Check if backend is running
lsof -i :3001    # macOS/Linux
netstat -ano | find "3001"  # Windows
```

### MongoDB connection failed
```bash
# Check if MongoDB is running
mongosh   # Connect to local MongoDB
```

### API 500 errors
- Check backend logs for error messages
- Verify `.env` configuration matches your environment
- Ensure CORS is properly configured for your domain

### Frontend showing blank or routing errors
- Ensure `dist/` folder exists
- Check web server is serving `index.html` for SPA routes
- Verify API proxy is correctly configured
