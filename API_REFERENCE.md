# Complete API Reference

## Quick Summary

**Backend URL:** `http://localhost:3001`

**Total Endpoints Implemented:** 20+

---

## Authentication Endpoints

### 1. Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth Required:** No
- **Params:** 
  - `username` (string) - required
  - `password` (string) - required
- **Response:** `{ token, user }`

### 2. Create Admin User
- **Method:** `POST`
- **Path:** `/api/auth/create-admin`
- **Auth Required:** No
- **Params:**
  - `username` (string) - defaults to "admin"
  - `password` (string) - defaults to "admin123"
  - `email` (string) - defaults to "admin@example.com"
- **Response:** `{ message: "Admin user created successfully" }`

---

## Games Endpoints

### 3. Get All Games
- **Method:** `GET`
- **Path:** `/api/games`
- **Auth Required:** No
- **Query Params:**
  - `status` (string) - filter by status
  - `gameType` (string) - filter by type
  - `page` (number) - default 1
  - `limit` (number) - default 50
- **Response:** `{ games: [], pagination: {} }`

### 4. Get Game Types
- **Method:** `GET`
- **Path:** `/api/games/types`
- **Auth Required:** No
- **Response:** `{ types: [ { value, label }, ... ] }`

### 5. Get Games for Admin
- **Method:** `GET`
- **Path:** `/api/games/admin`
- **Auth Required:** Yes
- **Query Params:**
  - `page` (number) - default 1
  - `limit` (number) - default 9
- **Response:** `{ games: [], pagination: {} }`

### 6. Get Latest Result
- **Method:** `GET`
- **Path:** `/api/games/latest-result`
- **Auth Required:** No
- **Response:** Result object

### 7. Create Game
- **Method:** `POST`
- **Path:** `/api/games`
- **Auth Required:** Yes
- **Body:**
  - `name` (string) - required
  - `description` (string)
  - `status` (string)
  - `gameType` (string)
  - `drawTime` (string)
  - `settings` (object)
- **Response:** Created game object

### 8. Get Single Game
- **Method:** `GET`
- **Path:** `/api/games/:id`
- **Auth Required:** Yes
- **Response:** Game object

### 9. Update Game
- **Method:** `PUT`
- **Path:** `/api/games/:id`
- **Auth Required:** Yes
- **Body:** Game fields to update
- **Response:** Updated game object

### 10. Delete Game
- **Method:** `DELETE`
- **Path:** `/api/games/:id`
- **Auth Required:** Yes
- **Response:** `{ message: "Game deleted successfully" }`

---

## Results Endpoints

### 11. Get All Results
- **Method:** `GET`
- **Path:** `/api/results`
- **Auth Required:** No
- **Query Params:**
  - `gameId` (string)
  - `isOfficial` (boolean)
  - `page` (number) - default 1
  - `limit` (number) - default 50
- **Response:** `{ results: [], pagination: {} }`

### 12. Get Single Result
- **Method:** `GET`
- **Path:** `/api/results/:id`
- **Auth Required:** No
- **Response:** Result object

### 13. Get Latest Results for Game
- **Method:** `GET`
- **Path:** `/api/results/latest/:gameId`
- **Auth Required:** No
- **Query Params:**
  - `limit` (number) - default 10
- **Response:** Array of results

### 14. Get Result Statistics
- **Method:** `GET`
- **Path:** `/api/results/stats/:gameId`
- **Auth Required:** No
- **Response:** `{ totalResults, officialResults, averagePrizePool }`

### 15. Create Result
- **Method:** `POST`
- **Path:** `/api/results`
- **Auth Required:** Yes
- **Body:**
  - `gameId` (string) - required
  - `result` (string) - required
  - `resultNumbers` (object)
  - `winningNumbers` (object)
  - `drawDate` (date)
  - `prizeDistribution` (object)
  - `totalPrizePool` (number)
  - `drawNumber` (string)
- **Response:** Created result object

### 16. Publish Result
- **Method:** `POST`
- **Path:** `/api/results/publish`
- **Auth Required:** Yes
- **Body:**
  - `gameId` (string) - required
  - `left` (string) - required
  - `center` (string) - required
  - `right` (string) - required
- **Response:** Published result object

### 17. Update Result
- **Method:** `PUT`
- **Path:** `/api/results/:id`
- **Auth Required:** Yes
- **Body:** Result fields to update
- **Response:** Updated result object

### 18. Delete Result
- **Method:** `DELETE`
- **Path:** `/api/results/:id`
- **Auth Required:** Yes
- **Response:** `{ message: "Result deleted successfully" }`

---

## Health Check

### 19. Health Check
- **Method:** `GET`
- **Path:** `/api/health`
- **Auth Required:** No
- **Response:** 
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "connected",
  "timestamp": "2025-12-05T18:58:42.485Z",
  "version": "2.0.0-enhanced"
}
```

---

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **404** - Not Found
- **500** - Internal Server Error

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

---

## Authentication Header

For protected endpoints, include:
```
Authorization: Bearer <token>
```

Where `<token>` is the JWT token received from login endpoint.
