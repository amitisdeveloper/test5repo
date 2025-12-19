# 555 Results - Setup Instructions

## 🚨 Troubleshooting the 500 Error

If you're getting a 500 error on the login endpoint, follow these steps:

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**Mac (with Homebrew):**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 3. Create Admin User
Since this is a fresh setup, you need to create the first admin user:

```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

### 4. Test Backend Health
Check if backend is running properly:
```bash
curl http://localhost:5000/api/health
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

## 🔧 Complete Setup Steps

### Step 1: Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Step 2: Frontend Setup (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Create Admin User
```bash
curl -X POST http://localhost:5000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

### Step 4: Test Login
1. Open frontend at http://localhost:5173
2. Go to /admin/login
3. Use credentials: admin / admin123

## 🛠️ Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** `MongoDB connection error`
**Solution:** 
- Ensure MongoDB is running
- Check if port 27017 is available
- Update MONGODB_URI in backend/.env if using different setup

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`
**Solution:**
```bash
# Kill process on port 5000
npx kill-port 5000
# Then restart backend
npm run dev
```

### Issue 3: CORS Error
**Error:** `Access to fetch blocked by CORS policy`
**Solution:** Ensure backend/.env has correct FRONTEND_URL:
```env
FRONTEND_URL=http://localhost:5173
```

### Issue 4: Environment Variables Not Loaded
**Error:** `Cannot read properties of undefined`
**Solution:** Ensure backend/.env exists and has all required variables:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 📋 Quick Commands Reference

### Backend Commands
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm start            # Start production server
```

### Frontend Commands
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

### Testing Commands
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test games endpoint
curl http://localhost:5000/api/games
```

## 🎯 Next Steps After Setup

1. **Test All Features**: Try creating games, publishing results
2. **Customize**: Update styling, add features as needed
3. **Production**: Configure for production deployment
4. **Security**: Change default admin password and JWT secret

## 📞 Still Having Issues?

If you're still getting errors:
1. Check terminal logs for detailed error messages
2. Ensure both frontend and backend are running
3. Verify MongoDB is accessible
4. Check browser console for frontend errors