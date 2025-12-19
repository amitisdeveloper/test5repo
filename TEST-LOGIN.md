# Login Test - Step by Step Debug

## 🔍 **IMMEDIATE DIAGNOSTIC STEPS**

### 1. Test Backend Directly
First, let's test if the backend is working:

```bash
cd backend
npm install
npm run dev
```

In a new terminal:
```bash
cd backend
npm run test:api
```

This will test:
- ✅ Health check
- ✅ Admin user creation
- ✅ Login endpoint
- ✅ Protected routes

### 2. Test Login with cURL
If backend is running, test login directly:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 3. Check Browser Network Tab
1. Open http://localhost:5173/admin/login
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Enter admin/admin123 and click login
5. Look for the POST request to `/api/auth/login`
6. Check the response status and data

## 🚨 **COMMON 500 ERROR CAUSES**

### Cause 1: MongoDB Not Running
**Error:** `MongoDB connection error`
**Fix:** Start MongoDB service

### Cause 2: Backend Not Running
**Error:** `Connection refused`
**Fix:** Run `npm run dev` in backend folder

### Cause 3: Port Conflict
**Error:** `EADDRINUSE`
**Fix:** Kill process on port 5000

### Cause 4: Environment Variables Missing
**Error:** Various undefined errors
**Fix:** Ensure backend/.env exists with all variables

### Cause 5: Dependencies Missing
**Error:** `Cannot find module`
**Fix:** Run `npm install` in backend folder

## 🔧 **QUICK FIXES**

### Fix 1: Complete Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173
# MONGODB_URI=mongodb://localhost:27017/555results
# JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
npm run dev
```

### Fix 2: Check MongoDB
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

### Fix 3: Kill Port Conflicts
```bash
# Kill process on port 5000
npx kill-port 5000
```

## 📋 **FRONTEND VERIFICATION**

After backend is working, verify frontend:

1. **Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Check API URLs in Components:**
   All components should have:
   ```typescript
   const API_BASE = 'http://localhost:5000/api';
   ```

3. **Test Frontend Login:**
   - Go to http://localhost:5173/admin/login
   - Use admin/admin123
   - Check Network tab for successful API calls

## 🎯 **EXPECTED FLOW**

1. **Frontend** makes POST to `http://localhost:5000/api/auth/login`
2. **Backend** processes request and connects to MongoDB
3. **Backend** validates credentials and returns JWT token
4. **Frontend** stores token and redirects to dashboard

If any step fails, the 500 error occurs at that point.

## 🔍 **DEBUG COMMANDS**

### Check if services are running:
```bash
# Check if backend is running on port 5000
curl http://localhost:5000/api/health

# Check MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"
```

### Check environment:
```bash
# Backend should show:
# "database": "connected"
# "status": "OK"
```

## 📞 **Next Steps**

1. Run the backend test script: `npm run test:api`
2. Share the output from the test
3. If backend test passes, the issue is in frontend
4. If backend test fails, we need to fix the backend setup first