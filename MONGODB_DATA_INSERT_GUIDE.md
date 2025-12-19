# MongoDB Data Insertion Guide

## Collections Affected

When inserting games with their results, you need to work with **4 main collections**:

1. **users** - User accounts (for createdBy references)
2. **games** - Game definitions and settings
3. **results** - Individual game results (detailed results)
4. **gamepublishedresults** - Published results (simplified results for public display)

---

## JSON Format for Each Collection

### 1. Users Collection (users)

**Required for creating games and results:**

```json
{
  "_id": "692b8304eebc2d966faecbcc",
  "username": "admin",
  "email": "admin@example.com",
  "password": "$2a$10$hashedPasswordHere",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-12-18T12:00:00.000Z",
  "updatedAt": "2024-12-18T12:00:00.000Z"
}
```

### 2. Games Collection (games)

**Required fields for each game:**

```json
{
  "_id": "6944377216a10f699b4e398a",
  "name": "Faridabad",
  "nickName": "Faridabad",
  "description": "Faridabad satta game",
  "status": "active",
  "gameType": "local",
  "drawTime": "2025-12-18T17:18:42.194Z",
  "createdBy": "692b8304eebc2d966faecbcc",
  "isActive": true,
  "settings": {
    "minNumber": 1,
    "maxNumber": 100,
    "drawCount": 1,
    "prizeStructure": null
  },
  "startTime": "2025-12-18T17:18:42.194Z",
  "endTime": "2025-12-18T18:18:42.194Z",
  "createdAt": "2025-12-18T17:18:42.195Z",
  "updatedAt": "2025-12-18T17:18:42.195Z",
  "__v": 0
}
```

**Game Type Options:**
- `"prime"` - Prime games
- `"local"` - Local games
- `"lottery"`, `"draw"`, `"raffle"`, `"other"`

**Status Options:**
- `"active"` - Game is active
- `"inactive"` - Game is inactive
- `"completed"` - Game is completed
- `"suspended"` - Game is suspended

### 3. Results Collection (results)

**Required fields for each result:**

```json
{
  "_id": "6944377b16a10f699b4e39a0",
  "gameId": "6944326116a10f699b4e3925",
  "result": "01",
  "resultNumbers": [],
  "drawDate": "2025-12-18T17:18:51.581Z",
  "winningNumbers": [],
  "prizeDistribution": [],
  "totalPrizePool": 0,
  "drawNumber": null,
  "isOfficial": true,
  "verifiedBy": "692b8304eebc2d966faecbcc",
  "verifiedAt": "2025-12-18T17:18:51.581Z",
  "createdAt": "2025-12-18T17:18:51.585Z",
  "updatedAt": "2025-12-18T17:18:51.585Z",
  "__v": 0
}
```

**Field Descriptions:**
- `gameId`: Reference to the game `_id`
- `result`: The published result number (string)
- `drawDate`: Date and time when the draw occurred
- `isOfficial`: Boolean indicating if this is an official result
- `verifiedBy`: Reference to user who verified the result

### 4. Game Published Results Collection (gamepublishedresults)

**Required fields for published results:**

```json
{
  "_id": "6944377c16a10f699b4e39a1",
  "gameId": "6944326116a10f699b4e3925",
  "publishDate": "2025-12-18T17:18:51.581Z",
  "publishedNumber": "01",
  "createdBy": "692b8304eebc2d966faecbcc",
  "createdAt": "2025-12-18T17:18:51.590Z",
  "updatedAt": "2025-12-18T17:18:51.590Z",
  "__v": 0
}
```

**Note**: This collection enforces unique constraint on `(gameId, publishDate)` - only one result per game per day.

---

## Complete Example: Bulk Insert JSON

### Sample Data Structure for Multiple Games with Results

```json
{
  "users": [
    {
      "_id": "692b8304eebc2d966faecbcc",
      "username": "admin",
      "email": "admin@555results.com",
      "password": "$2a$10$exampleHashedPassword",
      "role": "admin",
      "isActive": true
    }
  ],
  "games": [
    {
      "_id": "6944377216a10f699b4e398a",
      "nickName": "Faridabad",
      "status": "active",
      "gameType": "local",
      "createdBy": "692b8304eebc2d966faecbcc",
      "isActive": true,
      "settings": {
        "minNumber": 1,
        "maxNumber": 100,
        "drawCount": 1
      }
    },
    {
      "_id": "6944376916a10f699b4e3978",
      "nickName": "Shri Ganesh",
      "status": "active",
      "gameType": "local",
      "createdBy": "692b8304eebc2d966faecbcc",
      "isActive": true,
      "settings": {
        "minNumber": 1,
        "maxNumber": 100,
        "drawCount": 1
      }
    }
  ],
  "results": [
    {
      "gameId": "6944377216a10f699b4e398a",
      "result": "45",
      "drawDate": "2025-12-18T17:00:00.000Z",
      "isOfficial": true,
      "verifiedBy": "692b8304eebc2d966faecbcc",
      "verifiedAt": "2025-12-18T17:00:00.000Z"
    },
    {
      "gameId": "6944376916a10f699b4e3978",
      "result": "67",
      "drawDate": "2025-12-18T16:30:00.000Z",
      "isOfficial": true,
      "verifiedBy": "692b8304eebc2d966faecbcc",
      "verifiedAt": "2025-12-18T16:30:00.000Z"
    }
  ],
  "gamepublishedresults": [
    {
      "gameId": "6944377216a10f699b4e398a",
      "publishDate": "2025-12-18T17:00:00.000Z",
      "publishedNumber": "45",
      "createdBy": "692b8304eebc2d966faecbcc"
    },
    {
      "gameId": "6944376916a10f699b4e3978",
      "publishDate": "2025-12-18T16:30:00.000Z",
      "publishedNumber": "67",
      "createdBy": "692b8304eebc2d966faecbcc"
    }
  ]
}
```

---

## Insertion Order

**Important**: Insert data in this order to maintain referential integrity:

1. **Users first** (if creating new users)
2. **Games second** (reference users via createdBy)
3. **Results third** (reference games via gameId)
4. **Published Results last** (reference games via gameId)

---

## MongoDB Commands

### Using MongoDB Shell (mongo)
```javascript
// 1. Insert users
db.users.insertMany([...]);

// 2. Insert games
db.games.insertMany([...]);

// 3. Insert results
db.results.insertMany([...]);

// 4. Insert published results
db.gamepublishedresults.insertMany([...]);
```

---

## Important Notes

1. **ObjectId Format**: Use valid MongoDB ObjectId format (`24 hexadecimal characters`)
2. **Date Format**: Use ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
3. **Referential Integrity**: Always ensure referenced ObjectIds exist
4. **Unique Constraints**: `gamepublishedresults` enforces unique `(gameId, publishDate)`
5. **Timezone**: All dates should be in UTC (system converts to IST for display)