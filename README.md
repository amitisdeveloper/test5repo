# 555 Results React Application

A full-stack React application with Express.js backend and MongoDB for managing games and results.

## Features

- React frontend with TypeScript
- Express.js API backend
- MongoDB database with Mongoose ODM
- JWT authentication with role-based access
- User, Game, and Result management
- Tailwind CSS styling
- Vite development server with proxy

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. Make sure MongoDB is running on your system or use MongoDB Atlas
2. Install dependencies:
```bash
npm install
```

### Environment Setup

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your MongoDB connection string:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/555results
```

### Running the Application

This is a full-stack application that requires both frontend and backend servers to be running.

#### Option 1: Run both servers simultaneously (Recommended)
```bash
npm run dev:full
```

#### Option 2: Run servers separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Server will start on http://localhost:3001

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```
Frontend will start on http://localhost:5173

### Database Setup

The first time you run the application, you'll need to create an admin user:

**Create Admin User:**
```bash
curl -X POST http://localhost:3001/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","email":"admin@example.com"}'
```

### API Endpoints

The React frontend proxies API requests through Vite. Available endpoints:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/profile` - Get user profile (requires auth)
- `POST /api/auth/create-admin` - Create admin user (first run only)

#### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `POST /api/games` - Create new game (requires auth)
- `PUT /api/games/:id` - Update game (requires auth, owner/admin)
- `DELETE /api/games/:id` - Delete game (requires auth, owner/admin)
- `GET /api/games/user/my-games` - Get user's games (requires auth)

#### Results
- `GET /api/results` - Get all results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Create new result (requires auth)
- `PUT /api/results/:id` - Update result (requires admin)
- `DELETE /api/results/:id` - Delete result (requires admin)
- `GET /api/results/latest/:gameId` - Get latest results for a game
- `PATCH /api/results/:id/verify` - Mark result as official (requires admin)

### User Roles

- **User**: Can register, login, create games, and manage their own games
- **Admin**: Full access including verifying and managing all results

### Environment Variables

The application uses a `.env` file with the following variables:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
├── src/                    # React frontend source
│   ├── components/        # React components
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── models/               # MongoDB models
│   ├── User.js          # User model
│   ├── Game.js          # Game model
│   └── Result.js        # Result model
├── routes/               # Express API routes
│   ├── auth.js          # Authentication routes
│   ├── games.js         # Game management routes
│   └── results.js       # Results routes
├── server.js            # Express server with MongoDB connection
├── package.json         # Dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Database Collections

The application creates the following MongoDB collections:
- **users**: User accounts and authentication
- **games**: Game configurations and metadata
- **results**: Game results and outcomes

## Troubleshooting

- If you get 404 errors on API calls, ensure both frontend and backend servers are running
- Ensure MongoDB is running and the connection string in `.env` is correct
- Check that the database "555results" exists or will be created automatically
- The Vite dev server runs on port 5173 and proxies API calls to the backend on port 3001
- Check the console for any error messages from either server
- For connection issues, verify MongoDB is running: `mongo` or `mongosh`