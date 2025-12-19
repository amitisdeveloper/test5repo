# Quick Setup Guide

## For Local Development

### 1. First Time Setup
```bash
# Install dependencies
npm install

# Copy environment template
copy .env.example .env
```

### 2. Run Everything Together
```bash
npm run dev:enhanced
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- Frontend automatically proxies API calls to backend

### 3. Access the Application
- Open browser: **http://localhost:5173**
- Admin login already created:
  - Username: `admin`
  - Password: `admin123`

---

## Environment Variables for Local Dev

Your `.env` file is already configured for local development:

| Variable | Value | Note |
|----------|-------|------|
| `NODE_ENV` | `development` | - |
| `PORT` | `3001` | Backend port |
| `MONGODB_URI` | `mongodb://localhost:27017/555results` | Local MongoDB |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `VITE_API_URL` | `http://localhost:3001` | API URL for frontend build |

---

## For Ubuntu Production Server

### 1. Copy Production Template
```bash
cp .env.production.example .env
```

### 2. Update Environment Variables
```bash
# Edit .env with your production values
nano .env
```

Required changes:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Generate with: `openssl rand -hex 32`
- `FRONTEND_URL`: Your domain (e.g., `https://yourdomain.com`)
- `VITE_API_URL`: Same as `FRONTEND_URL` when using Nginx reverse proxy

### 3. Build Frontend
```bash
npm run build
```

### 4. Start Backend
```bash
npm run server:enhanced
```

### 5. Setup Nginx Reverse Proxy & SSL

See **DEPLOYMENT.md** for complete Ubuntu server setup with:
- Nginx reverse proxy configuration
- SSL certificate (Let's Encrypt)
- SystemD service setup
- Process monitoring

---

## Available NPM Commands

```bash
# Development
npm run dev              # Frontend only (port 5173)
npm run server           # Backend only (port 3001)
npm run dev:enhanced     # Frontend + Backend together

# Production
npm run build            # Build frontend for production
npm run server:enhanced  # Run backend with enhanced features

# Testing
npm run test:backend     # Test backend endpoints
npm run preview          # Preview production build
```

---

## Database: MongoDB Atlas

### Setup MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Add database user (username & password)
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/555results?retryWrites=true&w=majority
   ```
5. Replace in your `.env` file

### Security Notes
- **Never** commit `.env` to git
- Use strong passwords for MongoDB
- Restrict IP access in MongoDB Atlas (whitelist your server IP)
- Change `JWT_SECRET` in production

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /pid <PID> /f

# Kill process (Ubuntu)
sudo kill -9 <PID>
```

### MongoDB Connection Failed
- Verify MongoDB is running (local dev)
- Check connection string in `.env`
- Ensure IP is whitelisted in MongoDB Atlas (production)

### Frontend Can't Reach Backend
- Make sure both are running
- Check `FRONTEND_URL` in .env (must match frontend domain)
- Check browser console for CORS errors

### First Login Not Working
- Admin user should auto-create
- Check server logs for errors
- Verify MongoDB is connected

---

## Next Steps

1. Read **DEPLOYMENT.md** for Ubuntu server setup
2. Test locally with `npm run dev:enhanced`
3. Plan production deployment to Ubuntu
4. Setup MongoDB Atlas cluster
5. Configure domain and SSL
