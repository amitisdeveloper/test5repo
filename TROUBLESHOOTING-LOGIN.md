# Troubleshooting Login 500 Error

## Problem
Getting `500 Internal Server Error` when attempting login at `http://localhost:5173/api/auth/login`

## Root Causes & Solutions

### 1. **Backend Not Running**

**Check if backend is running:**
```bash
cd d:\reactapps\new555v2
node quick-test.js
```

**Expected output:**
```
✅ Backend is working!
Status: 200
Total Games: 6626
```

**If it fails:** Start the backend
```bash
cd backend
npm start
```

---

### 2. **Backend Running but Vite Dev Server Can't Reach It**

**Verify backend is accessible:**
```bash
cd d:\reactapps\new555v2
node test-login-endpoint.js
```

**Expected output:**
```
✅ Direct login successful!
   Status: 200
   User: admin
   Token: eyJhbGciOiJIUzI1NiIs...
```

**If it fails:** 
- Backend server crashed or is hung
- MongoDB connection failed
- Check backend logs in terminal

---

### 3. **Vite Proxy Not Working**

When you visit `http://localhost:5173`, requests to `/api/*` should be proxied to `http://localhost:3001/api/*`

**How to verify proxy is working:**

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Make a login attempt
4. Look for the request path:
   - ❌ **WRONG:** `localhost:5173/api/auth/login` (staying on frontend)
   - ✅ **CORRECT:** `localhost:3001/api/auth/login` (proxied to backend)

**If proxy is not working:**
- Restart Vite dev server: Kill and re-run `npm run dev`
- Check `vite.config.ts` has correct proxy config
- Ensure `node_modules` is up to date: `npm install`

---

### 4. **Check Credentials**

Default admin credentials:
```
Username: admin
Password: admin123
```

Test with these exact credentials. If you changed the password, you need to know the new one.

---

## Step-by-Step Debugging

### Terminal 1: Start Backend
```bash
cd d:\reactapps\new555v2\backend
npm start
```

Wait for output:
```
Server running on port 3001 in development mode
Connected to MongoDB: mongodb://localhost:27017/555results
```

### Terminal 2: Verify Backend Works
```bash
cd d:\reactapps\new555v2
node quick-test.js
```

Should show: `✅ Backend is working!`

### Terminal 3: Start Frontend
```bash
cd d:\reactapps\new555v2
npm run dev
```

Wait for output:
```
VITE v... ready in ... ms
➜ Local: http://localhost:5173/
```

### Terminal 4: Test Login Endpoint
```bash
cd d:\reactapps\new555v2
node test-login-endpoint.js
```

Should show all ✅ tests passing.

### Browser: Test Frontend Login
1. Visit `http://localhost:5173`
2. Click "Admin Login"
3. Enter: username=`admin`, password=`admin123`
4. Click Login

### If Still Getting 500 Error

**Check browser console (F12):**
- Look for any JavaScript errors
- Check Network tab for response details

**Check backend terminal:**
- Look for error messages
- Should see login attempt logged

**Check Vite terminal:**
- Look for proxy errors
- Should show request being proxied

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/auth/login" (404) | Backend not running. Start with `npm start` |
| "ECONNREFUSED" error | Backend not running or on wrong port |
| "Invalid credentials" | Check username/password |
| CORS error in browser | Check `.env` FRONTEND_URL matches `http://localhost:5173` |
| Database connection error | Check MongoDB is running |

---

## Environment Configuration Check

**File:** `.env`
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=dev-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

All values should match your setup.

---

## Complete Log Example

### Successful Backend Start:
```
> 555-results-backend@1.0.0 start
> node server.js

Server running on port 3001 in development mode
Connected to MongoDB: mongodb://localhost:27017/555results
```

### Successful Frontend Start:
```
  VITE v5.0.0  ready in 324 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Successful Login Test:
```
🔐 Testing Login Endpoint...

1. Testing direct backend call...
✅ Direct login successful!
   Status: 200
   User: admin
   Token: eyJhbGciOiJIUzI1NiIs...

2. Testing invalid credentials...
✅ Correctly rejected invalid password
   Error: Invalid credentials

3. Testing missing credentials...
✅ Correctly rejected missing password
   Error: Username and password are required
```

---

## Still Having Issues?

1. **Close all terminals and Node processes**
   ```bash
   taskkill /IM node.exe /F
   ```

2. **Clear Vite cache**
   ```bash
   rmdir /s "node_modules\.vite"
   ```

3. **Reinstall dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

4. **Start fresh:**
   - Terminal 1: `cd backend && npm start`
   - Terminal 2: `npm run dev`
   - Browser: `http://localhost:5173`
