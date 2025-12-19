# Local Development Setup Guide

## ✅ Current Status

Your 555 Results app is now **fully functional** on local development! Here's what's working:

### 🟢 Running Services

1. **Development Backend**: `http://localhost:3001`
   - Express.js server with MongoDB connection
   - JWT authentication system
   - API endpoints for users, games, and results
   - Admin user: `admin` / `admin123`

2. **Development Frontend**: `http://localhost:5173`
   - React app with Vite dev server
   - Tailwind CSS styling
   - API proxy configuration
   - Hot reload enabled

3. **Production Preview**: `http://localhost:4173`
   - Built React app with Vite preview
   - Serves static files from `dist/`
   - API proxy to backend

### 🧪 Tested Endpoints

All major endpoints are working:

- ✅ `GET /api/health` - Server health check
- ✅ `POST /api/auth/login` - User authentication
- ✅ `POST /api/auth/create-admin` - Admin user creation
- ✅ `GET /api/games` - Games listing (with auth)
- ✅ `POST /api/games` - Game creation (with auth)
- ✅ MongoDB connection and operations

### 📁 Project Structure

```
555results/
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── utils/            # API utilities
│   └── App.tsx           # Main app
├── models/               # MongoDB models
│   ├── User.js          # User model
│   ├── Game.js          # Game model
│   └── Result.js        # Result model
├── routes/               # API routes
│   ├── auth.js          # Authentication
│   ├── games.js         # Games API
│   └── results.js       # Results API
├── dist/                # Production build
├── public/.htaccess     # SPA routing config
├── server.js            # Express server
├── ecosystem.config.js  # PM2 configuration
├── .env                 # Environment variables
└── scripts/             # Utility scripts
    ├── test-local.sh    # Local testing script
    └── deploy-ubuntu.sh # Ubuntu deployment
```

## 🚀 Quick Start Commands

### Start Development Environment
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev

# Or start both together
npm run dev:full
```

### Start Production Environment
```bash
# Terminal 1 - Backend (production mode)
npm run start

# Terminal 2 - Frontend (production build)
npm run preview
```

### Run Tests
```bash
# Test all endpoints and functionality
chmod +x scripts/test-local.sh
./scripts/test-local.sh

# Test backend only
npm run test:backend
```

## 🔧 Configuration

### Environment Variables (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=dev-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

### MongoDB Setup
- **Local**: Uses `mongodb://localhost:27017/555results`
- **Atlas**: Update `MONGODB_URI` in `.env` to use MongoDB Atlas

## 🧪 Testing

### Manual Testing
1. **Health Check**: `curl http://localhost:3001/api/health`
2. **Login**: POST to `/api/auth/login` with admin credentials
3. **Games**: GET `/api/games` with Authorization header
4. **Frontend**: Open `http://localhost:5173` in browser

### Automated Testing
```bash
./scripts/test-local.sh
```

Tests:
- Backend connectivity
- Frontend accessibility
- Authentication flow
- Database operations
- Production build

## 📊 Available URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Dev Frontend | http://localhost:5173 | React development |
| Dev Backend | http://localhost:3001 | API development |
| Prod Preview | http://localhost:4173 | Production build test |
| MongoDB | mongodb://localhost:27017 | Database |

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3001
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

2. **MongoDB connection failed**
   ```bash
   # Check if MongoDB is running
   mongo --version
   # Or use MongoDB Atlas instead
   ```

3. **Frontend not loading**
   ```bash
   # Restart development server
   npm run dev
   ```

4. **CORS errors**
   - Check `FRONTEND_URL` in `.env`
   - Verify CORS settings in `server.js`

### Log Locations
- Backend logs: Terminal running `npm run dev:server`
- Frontend logs: Terminal running `npm run dev`
- MongoDB logs: Check MongoDB installation directory

## 🔄 Development Workflow

### Making Changes
1. **Frontend changes**: Hot reload automatically updates browser
2. **Backend changes**: Restart backend server
3. **Database changes**: Models auto-update on server restart

### Testing Changes
1. Run `./scripts/test-local.sh` to verify all endpoints
2. Test in browser at `http://localhost:5173`
3. Check network requests in browser dev tools

### Adding Features
1. Create new routes in `routes/`
2. Add models in `models/`
3. Create React components in `src/components/`
4. Update API utilities in `src/utils/api.ts`

## 📦 Production Build

### Build for Production
```bash
npm run build
```

Build output in `dist/`:
- Optimized JavaScript and CSS
- Minified assets
- Proper caching headers
- SPA routing support

### Test Production Build
```bash
npm run preview
```
Serves built files on `http://localhost:4173`

## 🔐 Security Notes

### Development
- Uses development JWT secret
- CORS allows localhost
- MongoDB on local machine

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Update `MONGODB_URI` to MongoDB Atlas
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS/SSL
- [ ] Set up proper firewall rules

## 📚 Next Steps

1. **Continue Development**: Use the working local environment
2. **Add Features**: Extend functionality as needed
3. **Test Thoroughly**: Use the testing scripts
4. **Prepare for Deployment**: Ready for Ubuntu Apache deployment

Your app is production-ready! 🎉