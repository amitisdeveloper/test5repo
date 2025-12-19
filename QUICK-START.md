# 555 Results - Quick Start Guide

## Development (Local)

### 1. First Time Setup
```bash
npm install
npm run create-admin
```

### 2. Environment Setup
Copy `.env.example` to `.env` (already configured for local MongoDB)

### 3. Start Development
```bash
npm run dev:full
```

**Access:**
- App: http://localhost:5173
- API: http://localhost:3001
- Admin: http://localhost:5173/admin/login

---

## Production Deployment (Ubuntu + Apache)

### 1. One-Command Deployment
```bash
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

This script:
- Installs Node.js, Apache, MongoDB
- Configures SSL (Let's Encrypt)
- Sets up systemd service
- Proxies Apache → Node.js

### 2. Manual Deployment
Follow detailed steps in `UBUNTU-DEPLOYMENT.md`

### 3. Post-Deployment
```bash
# Create admin user
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD","email":"admin@example.com"}'

# Check health
curl https://yourdomain.com/api/health
```

---

## Project Structure

```
app/
├── src/              → React frontend (TypeScript)
├── models/           → MongoDB schemas
├── routes/           → Express API endpoints
├── server.js         → Node.js + Express server
├── .env              → Configuration (git ignored)
└── dist/             → Built frontend (production)
```

---

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev:full` | Start both servers locally |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run create-admin` | Create admin user interactively |
| `sudo ./deploy.sh` | Full Ubuntu deployment |

---

## Database

### Local Development
- MongoDB: `mongodb://localhost:27017/555-results`
- No setup needed if MongoDB is installed

### Production
- MongoDB Atlas: Free M0 tier recommended
- Get connection string from Atlas dashboard
- Add IP whitelist in Atlas security settings

---

## Architecture

```
User Browser
    ↓
Apache (Port 80/443) ← SSL Certificate
    ↓
Node.js (Port 3001) ← Express Server
    ↓
MongoDB Atlas
    ↓
Database
```

In development:
```
User Browser
    ↓
Vite Dev Server (Port 5173) ← React
    ↓
Node.js (Port 3001) ← Express
```

---

## Admin Dashboard

**URL:** `/admin/login`

**Features:**
- View all games with pagination
- Filter by game type, name, date
- Create/edit games
- Publish results
- Manage users

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty games list | Run test: `node test-admin-endpoint.js` |
| MongoDB not found | Ensure MongoDB is running or Atlas URI is correct |
| Port 3001 in use | `lsof -i :3001` then `kill -9 <PID>` |
| Blank page after deploy | Check `dist/` folder exists; run `npm run build` |
| SSL certificate error | Re-run: `sudo certbot renew` |

---

## Environment Variables

**Development (.env):**
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555-results
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

**Production (.env):**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/555-results
JWT_SECRET=<generate: openssl rand -hex 32>
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/games` | No | Get all active games |
| GET | `/api/games/admin` | No | Get all games (paginated) |
| POST | `/api/games` | Yes | Create game |
| GET | `/api/auth/profile` | Yes | Get user profile |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/create-admin` | No | Create admin |
| GET | `/api/health` | No | Server health |

---

## Documentation

- **Development:** See `LOCAL-SETUP.md`
- **Production:** See `UBUNTU-DEPLOYMENT.md`
- **Full API:** See `API_REFERENCE.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`

---

## Key Features

✅ React + Node.js + MongoDB stack  
✅ JWT authentication  
✅ Admin dashboard with pagination  
✅ MongoDB Atlas support  
✅ Apache reverse proxy  
✅ Let's Encrypt SSL  
✅ Automated deployment script  
✅ Production-ready  

---

## Next Steps

1. Run locally: `npm run dev:full`
2. Create admin: `npm run create-admin`
3. Visit: http://localhost:5173
4. Deploy: `sudo ./deploy.sh` (on Ubuntu server)

---

**For detailed info:** Check documentation files in root directory
