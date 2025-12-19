# 555 Results Backend

A Node.js + Express.js API server for the 555 Results live gaming platform.

## Features

- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **bcrypt** password hashing
- **CORS** enabled for cross-origin requests
- **Environment-based** configuration
- **RESTful API** design

## Project Structure

```
backend/
├── models/                  # MongoDB models
│   ├── User.js             # User model
│   ├── Game.js             # Game model
│   └── Result.js           # Result model
├── routes/                  # API routes
│   ├── auth.js             # Authentication routes
│   ├── games.js            # Game management routes
│   └── results.js          # Result management routes
├── middleware/              # Custom middleware
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/555results
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Environment Variables Explanation

- **PORT**: Server port (default: 5000)
- **NODE_ENV**: Environment mode (development/production)
- **FRONTEND_URL**: Frontend application URL for CORS
- **MONGODB_URI**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT token signing

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon for development
- `npm test` - Run tests (if configured)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `GET /profile` - Get user profile (protected)
- `POST /create-admin` - Create admin user

### Games (`/api/games`)
- `GET /` - Get all active games
- `GET /admin` - Get all games with pagination (protected)
- `GET /:id` - Get specific game
- `POST /` - Create new game (protected)
- `PUT /:id` - Update game (protected)
- `DELETE /:id` - Delete game (protected)
- `GET /latest-result` - Get latest result

### Results (`/api/results`)
- `GET /` - Get all results
- `GET /:id` - Get specific result
- `POST /` - Create new result (protected)
- `PUT /:id` - Update result (protected)
- `DELETE /:id` - Delete result (protected)
- `GET /latest/:gameId` - Get latest results for a game
- `PATCH /:id/verify` - Mark result as official (protected)

### Health Check
- `GET /api/health` - Server health status

## Database Models

### User Model
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (user/admin)
- `isActive` - Account status

### Game Model
- `nickName` - Game display name
- `gameType` - Type (prime/local)
- `startTime` - Game start time
- `endTime` - Game end time
- `isActive` - Game status
- `createdBy` - Reference to User

### Result Model
- `gameId` - Reference to Game
- `result` - Game result
- `drawDate` - When result was drawn
- `isOfficial` - Result verification status
- `verifiedBy` - Reference to User who verified

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Login with username/email and password
2. Receive JWT token in response
3. Include token in Authorization header: `Bearer <token>`
4. Protected routes require valid token

## Development

Start the development server:

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 5000)

## Production

Build and start for production:

```bash
npm start
```

## API Testing

You can test the API using tools like:
- Postman
- Insomnia
- curl

### Example cURL commands:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get games (public)
curl http://localhost:5000/api/games

# Get games (protected)
curl http://localhost:5000/api/games/admin \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Default Admin User

To create a default admin user:

1. Start the server
2. Make a POST request to `/api/auth/create-admin`
3. Default credentials: username=`admin`, password=`admin123`

**Important**: Change the default admin password after creation!

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Environment-based configuration
- Input validation and sanitization
- Error handling without sensitive data exposure

## Contributing

1. Follow RESTful API design principles
2. Add proper error handling
3. Include input validation
4. Update documentation for new endpoints
5. Test thoroughly before submitting