# Local Development Setup

Complete guide for setting up the 555 Results application on your local machine.

## Prerequisites

- **Node.js** v16 or higher (Download from https://nodejs.org/)
- **MongoDB** - Either:
  - Local MongoDB installation, OR
  - MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- **npm** (comes with Node.js)

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment

**Option A: Use Local MongoDB**
```bash
# Create .env file
copy .env.example .env

# Edit .env and keep default MongoDB local connection:
# MONGODB_URI=mongodb://localhost:27017/555-results
```

**Option B: Use MongoDB Atlas (Recommended)**
```bash
# Create .env file
copy .env.example .env

# Get your MongoDB Atlas connection string:
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account and cluster
# 3. Get connection string
# 4. Edit .env and replace MONGODB_URI with your connection string
```

### 3. Create Admin User
```bash
npm run create-admin
```

Or use curl:
```bash
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

### 4. Start Development Servers

**Terminal 1 - Start both servers together:**
```bash
npm run dev:full
```

**OR run separately:**

Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Admin Login: http://localhost:5173/admin/login

## Available Scripts

```bash
# Development
npm run dev              # Start React dev server only
npm run dev:server      # Start Node/Express server only
npm run dev:full        # Start both servers (recommended)

# Build for Production
npm run build           # Build React frontend to dist/

# Production
npm start               # Run server in production mode

# Testing & Admin
npm run create-admin    # Interactive admin user creation
npm run test:backend    # Test backend endpoints
```

## Project Structure

```
├── src/                          # React frontend
│   ├── components/              # React components
│   ├── utils/                  # Helper functions
│   ├── App.tsx                 # Main app
│   └── main.tsx                # Entry point
├── models/                       # MongoDB schemas
│   ├── User.js                 # User model
│   ├── Game.js                 # Game model
│   └── Result.js               # Result model
├── routes/                       # Express API endpoints
│   ├── auth.js                 # Authentication
│   ├── games.js                # Game management
│   └── results.js              # Results
├── server.js                     # Express server
├── vite.config.ts              # Vite config
├── package.json                # Dependencies
└── .env                         # Environment variables
```

## Environment Variables

**Development (.env)**
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555-results
JWT_SECRET=dev-secret-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

**Production (.env.production.example)**
Copy and update for production deployments.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get current user profile (requires auth)
- `POST /api/auth/create-admin` - Create admin user

### Games
- `GET /api/games` - Get all active games
- `GET /api/games/admin` - Get all games with pagination (admin)
- `GET /api/games/:id` - Get specific game
- `POST /api/games` - Create new game (requires auth)
- `PUT /api/games/:id` - Update game (requires auth)
- `DELETE /api/games/:id` - Delete game (soft delete, requires auth)
- `GET /api/games/user/my-games` - Get user's games (requires auth)

### Results
- `GET /api/results` - Get all results
- `GET /api/results/:id` - Get specific result
- `POST /api/results` - Create new result (requires auth)
- `PUT /api/results/:id` - Update result (requires admin)
- `DELETE /api/results/:id` - Delete result (requires admin)

### Health
- `GET /api/health` - Server health check

## Testing the API

### Using cURL

**Create Admin:**
```bash
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Games (with token):**
```bash
curl -X GET "http://localhost:3001/api/games/admin?page=1&limit=9" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get Health:**
```bash
curl http://localhost:3001/api/health
```

## Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. If using local MongoDB: Start MongoDB service
   - Windows: `net start MongoDB`
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

2. If using MongoDB Atlas: Check connection string in .env
   - Verify username/password
   - Check IP whitelist (add 0.0.0.0/0 for development)
   - Test connection: `mongosh "your-connection-string"`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Kill process using port 3001
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:** 
- Check FRONTEND_URL in .env matches your frontend URL
- Verify backend is running on correct port
- Restart both servers

### Empty Games List
- Ensure MongoDB has data in games collection
- Check if token/authentication is working
- Test: `curl http://localhost:3001/api/games/admin?page=1&limit=9`
- Check browser console for errors

## Building for Production

```bash
# Build React frontend
npm run build

# Output goes to: dist/

# Start server in production mode
NODE_ENV=production npm start
```

## Database Management

### MongoDB Commands

**Access MongoDB Compass (GUI)**
- Download: https://www.mongodb.com/products/compass
- Connection: mongodb://localhost:27017

**Using mongosh CLI:**
```bash
mongosh
use 555-results
db.games.find().limit(5)
db.users.find()
db.results.find()
```

### Sample Data

Insert sample game:
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Game",
    "description": "Test game for development",
    "gameType": "lottery",
    "status": "active"
  }'
```

## Frontend Notes

- Built with React 18 + TypeScript
- Styled with Tailwind CSS
- Uses React Router for navigation
- Proxies API calls to http://localhost:3001 (configured in vite.config.ts)

## Backend Notes

- Express.js server
- MongoDB with Mongoose ODM
- JWT authentication
- CORS enabled for frontend
- Runs on port 3001 by default

## Next Steps

1. Read UBUNTU-DEPLOYMENT.md for production deployment
2. Check API_REFERENCE.md for detailed endpoint documentation
3. Review TROUBLESHOOTING.md for common issues
4. Visit http://localhost:5173 to start using the app

## Support

For issues or questions:
1. Check error logs in console
2. Verify .env configuration
3. Ensure all services are running (Node + MongoDB)
4. Check network connectivity
5. Review TROUBLESHOOTING.md
