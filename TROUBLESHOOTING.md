# Troubleshooting Guide

## The 404 Error Issue

If you're getting a 404 error on `http://localhost:5173/api/auth/login`, it means the backend server isn't running or there's a connectivity issue.

## Step-by-Step Resolution

### 1. Prerequisites Check
- Ensure MongoDB is running on your system
- Verify you have all dependencies installed

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB (if not already running)

**Option A: Local MongoDB**
```bash
# On Windows
net start MongoDB

# On macOS (with Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

**Option B: Use MongoDB Atlas**
If you're using MongoDB Atlas, ensure your connection string in `.env` is correct.

### 4. Start the Backend Server

**Method 1: Run both servers together (Recommended)**
```bash
npm run dev:full
```

**Method 2: Run servers separately**

**Terminal 1 - Backend:**
```bash
npm run server
```
Wait for: "Server running on port 3001" and "Connected to MongoDB"

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Wait for: "Local: http://localhost:5173"

### 5. Test the Backend

Run the test script to verify everything is working:
```bash
node test-backend.js
```

This will test:
- Backend connectivity
- MongoDB connection
- Admin user creation
- Login functionality
- Protected endpoints

### 6. Test the Frontend

Once both servers are running:
1. Open your browser to `http://localhost:5173`
2. Try logging in with:
   - Username: `admin`
   - Password: `admin123`

## Common Issues and Solutions

### Issue 1: "Cannot connect to MongoDB"
**Solution:**
- Check if MongoDB is running: `mongo` or `mongosh`
- Verify the connection string in `.env`
- Try: `MONGODB_URI=mongodb://127.0.0.1:27017/555results`

### Issue 2: "Backend server won't start"
**Solution:**
- Check if port 3001 is already in use
- Kill existing processes: `lsof -ti:3001 | xargs kill -9` (macOS/Linux)
- Or restart your computer to free the port

### Issue 3: "Frontend proxy not working"
**Solution:**
- Ensure both servers are running
- Check `vite.config.ts` proxy configuration
- Try accessing the backend directly: `http://localhost:3001/api/health`

### Issue 4: "Admin user doesn't exist"
**Solution:**
- The backend will automatically create an admin user on first run
- Or manually create one using the test script
- Or use the API endpoint: `POST /api/auth/create-admin`

## Quick Test Commands

### Test Backend Only
```bash
npm run server
# In another terminal:
curl http://localhost:3001/api/health
```

### Test Frontend to Backend Communication
```bash
npm run dev
# Then in browser console:
fetch('http://localhost:5173/api/health').then(r => r.json()).then(console.log)
```

### Full System Test
```bash
# Terminal 1
npm run server

# Terminal 2  
npm run dev

# Terminal 3
node test-backend.js
```

## Environment Configuration

Your `.env` file should contain:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Need More Help?

1. Check the console logs for error messages
2. Ensure MongoDB is accessible
3. Verify all ports are available (3001 for backend, 5173 for frontend)
4. Try restarting both servers if issues persist