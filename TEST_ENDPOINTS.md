# API Endpoints Test Guide

## All Available Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login (no auth needed)
- `POST /api/auth/create-admin` - Create admin user (no auth needed)

### Games (`/api/games`)
- `GET /api/games` - Get all games (public)
- `GET /api/games/types` - Get game types (public)
- `GET /api/games/admin?page=1&limit=9` - Get games for admin panel (auth required)
- `GET /api/games/latest-result` - Get latest result (public)
- `GET /api/games/:id` - Get single game (auth required)
- `POST /api/games` - Create new game (auth required)
- `PUT /api/games/:id` - Update game (auth required)
- `DELETE /api/games/:id` - Delete game (auth required)

### Results (`/api/results`)
- `GET /api/results` - Get all results (public)
- `GET /api/results/:id` - Get single result (public)
- `GET /api/results/latest/:gameId` - Get latest results for a game (public)
- `GET /api/results/stats/:gameId` - Get stats for a game (public)
- `POST /api/results` - Create result (auth required)
- `POST /api/results/publish` - Publish result (auth required)
- `PUT /api/results/:id` - Update result (auth required)
- `DELETE /api/results/:id` - Delete result (auth required)

---

## Testing with cURL

### 1. Login to Get Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Response:**
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

Save the token from response: `TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 2. Test Public Endpoints (No Auth Needed)

**Get all games:**
```bash
curl http://localhost:3001/api/games
```

**Get game types:**
```bash
curl http://localhost:3001/api/games/types
```

**Get all results:**
```bash
curl http://localhost:3001/api/results
```

**Get latest result:**
```bash
curl http://localhost:3001/api/games/latest-result
```

---

### 3. Test Protected Endpoints (Auth Required)

Replace `TOKEN` with your actual token.

**Get games for admin (with pagination):**
```bash
curl http://localhost:3001/api/games/admin?page=1&limit=9 \
  -H "Authorization: Bearer TOKEN"
```

**Create a new game:**
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Prime Game 1",
    "description": "First prime game",
    "status": "active",
    "gameType": "prime",
    "drawTime": "12:00 PM"
  }'
```

**Publish a result:**
```bash
curl -X POST http://localhost:3001/api/results/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "gameId": "GAME_ID_HERE",
    "left": "1",
    "center": "2",
    "right": "3"
  }'
```

---

## Testing with Frontend

1. Open http://localhost:5173
2. Click Admin Login
3. Enter username: `admin`, password: `admin123`
4. Dashboard should now load with API data

---

## Troubleshooting

### 401 Unauthorized
- Token is missing or invalid
- Add `Authorization: Bearer TOKEN` header
- Token may have expired

### 404 Not Found
- Route doesn't exist
- Check endpoint path spelling
- Verify server is running on port 3001

### 500 Internal Server Error
- Check server logs
- Verify MongoDB is connected
- Check request body format

### CORS Error
- Make sure `FRONTEND_URL` in .env matches frontend domain
- For local dev: `http://localhost:5173`
