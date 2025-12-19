# Technical Specification: Game Result Publishing System

## Technical Context

**Backend:**
- Language/Version: Node.js + Express.js ^4.18.2
- Database: MongoDB with Mongoose ^8.0.3
- Authentication: JWT (jsonwebtoken ^9.0.2)
- Existing models: Game, Result, User
- Server entry point: `backend/server.js`
- Routes: `backend/routes/games.js`, `backend/routes/results.js`

**Frontend:**
- Framework: React ^18.2.0 with TypeScript
- Build tool: Vite
- Styling: TailwindCSS
- UI Components: Custom React components with Lucide React icons
- Components location: `src/components/`
- Existing patterns: Modal-based forms, pagination, token-based auth

---

## Technical Implementation Brief

### Key Architecture Decisions

1. **Game Model Simplification**
   - Deprecate `startTime` and `endTime` fields (keep in schema for backward compatibility)
   - Add migration strategy to handle existing games
   - Game creation endpoint now only requires: `name` (rename from `nickName` for clarity)
   - Game type enumeration remains: 'lottery', 'draw', 'raffle', 'other', 'prime', 'local'

2. **New GameResult Model**
   - Create separate `GamePublishedResult` model (distinct from existing `Result`)
   - Fields: `gameId` (ref), `publishDate` (date only, no time), `publishedNumber` (string)
   - Unique compound index: `(gameId, publishDate)` to enforce one result per game per day
   - Include `createdAt`, `updatedAt`, `createdBy` for audit trail

3. **API Design**
   - **POST /api/admin/game-results** - Publish result (with duplicate validation)
   - **GET /api/admin/game-results** - List results with pagination and date range filter
   - **PUT /api/admin/game-results/:id** - Update published result
   - **DELETE /api/admin/game-results/:id** - Delete published result
   - All endpoints require admin authentication (existing middleware pattern)

4. **Frontend Components**
   - Reuse existing modal pattern for "Publish Result" form
   - Create new "Results Management" page component
   - Implement datatable with TailwindCSS (or use simple HTML table with styling)
   - Date range picker using HTML5 date inputs
   - Loading states and error handling consistent with existing AdminDashboard

5. **Validation Strategy**
   - Backend: Unique constraint + explicit duplicate check in API (fail fast)
   - Frontend: Prevent form submission if game+date combo exists
   - Error response format: `{ error: "A result for this game already exists on this date" }`

6. **Game Creation Endpoint Changes**
   - Modify POST /api/games from requiring `startTime`/`endTime` to requiring only `name`
   - This is a breaking change; old endpoint can accept both for backward compatibility
   - New simplified game creation in admin dashboard UI

---

## Source Code Structure

```
backend/
├── models/
│   ├── Game.js (modify: remove startTime/endTime requirement)
│   ├── GamePublishedResult.js (NEW)
│   ├── Result.js (keep as is)
│   └── User.js (unchanged)
├── routes/
│   ├── games.js (modify: simplify game creation)
│   ├── gameResults.js (NEW - for published results CRUD)
│   └── results.js (unchanged)
└── middleware/
    └── auth.js (unchanged)

src/components/
├── AdminDashboard.tsx (modify: simplify game creation form)
├── GameResults.tsx (NEW - results datatable)
├── PublishResultModal.tsx (NEW - modal for publishing results)
└── (existing components unchanged)
```

---

## Contracts

### Data Models

#### GamePublishedResult Schema (NEW)
```javascript
{
  _id: ObjectId,
  gameId: ObjectId (ref: Game, required),
  publishDate: Date (required, stored as date only),
  publishedNumber: String (required),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date,
  
  // Unique index
  index: { gameId: 1, publishDate: 1 } (unique)
}
```

#### Game Schema (MODIFIED)
```javascript
// Remove requirement for startTime, endTime
// Existing fields: name, nickName, description, status, gameType, createdBy, isActive, settings
// New behavior: Both name and nickName optional (for backward compatibility)
```

### API Endpoints

#### 1. Publish Game Result
```
POST /api/admin/game-results
Authorization: Bearer {token}

Request Body:
{
  gameId: string,           // MongoDB ObjectId
  publishDate: string,      // ISO date format: YYYY-MM-DD
  publishedNumber: string   // Numeric string
}

Response (201):
{
  _id: string,
  gameId: {
    _id: string,
    name: string           // or nickName if that's used
  },
  publishDate: string,
  publishedNumber: string,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}

Error Responses:
- 400: { error: "gameId, publishDate, and publishedNumber are required" }
- 404: { error: "Game not found" }
- 409: { error: "A result for this game already exists on this date" }
- 401: { error: "Access denied" }
```

#### 2. Get Published Results
```
GET /api/admin/game-results?page=1&limit=10&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Authorization: Bearer {token}

Query Parameters:
- page (optional): Pagination page number (default: 1)
- limit (optional): Items per page (default: 10)
- startDate (optional): Filter results on or after this date
- endDate (optional): Filter results on or before this date
- gameId (optional): Filter by specific game

Response (200):
{
  results: [
    {
      _id: string,
      gameId: {
        _id: string,
        name: string
      },
      publishDate: string,
      publishedNumber: string,
      createdAt: string,
      updatedAt: string
    }
  ],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

#### 3. Update Published Result
```
PUT /api/admin/game-results/:id
Authorization: Bearer {token}

Request Body:
{
  publishedNumber: string   // Only this field can be updated
}

Response (200):
{
  _id: string,
  gameId: { ... },
  publishDate: string,
  publishedNumber: string,
  updatedAt: string
}

Error Responses:
- 404: { error: "Result not found" }
- 403: { error: "Only administrators can update results" }
```

#### 4. Delete Published Result
```
DELETE /api/admin/game-results/:id
Authorization: Bearer {token}

Response (200):
{ message: "Result deleted successfully" }

Error Responses:
- 404: { error: "Result not found" }
- 403: { error: "Only administrators can delete results" }
```

#### 5. Get All Games (for dropdown in modal)
```
GET /api/admin/games/active-games
Authorization: Bearer {token}

Response (200):
[
  {
    _id: string,
    name: string,
    nickName: string,
    gameType: string,
    isActive: boolean
  }
]
```

### Frontend Component Props

#### PublishResultModal Props
```typescript
interface PublishResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onSubmit: (data: {
    gameId: string;
    publishDate: string;
    publishedNumber: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

interface Game {
  _id: string;
  name: string;
  nickName?: string;
  gameType: string;
  isActive: boolean;
}
```

#### GameResults Component Props
```typescript
interface GameResultsPageProps {
  // No props required - component manages its own state
}

interface GameResultItem {
  _id: string;
  gameId: {
    _id: string;
    name: string;
  };
  publishDate: string;
  publishedNumber: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Delivery Phases

### Phase 1: Backend - Model & API Foundation
**Goal**: Create GamePublishedResult model and all CRUD endpoints with validation

**Tasks:**
1. Create `backend/models/GamePublishedResult.js` with schema and unique index
2. Create `backend/routes/gameResults.js` with:
   - POST /api/admin/game-results (with duplicate date check)
   - GET /api/admin/game-results (with pagination & date filtering)
   - PUT /api/admin/game-results/:id
   - DELETE /api/admin/game-results/:id
   - GET /api/admin/games/active-games (helper endpoint)
3. Add route to `backend/server.js`
4. Add error handling and validation

**Deliverables:**
- GamePublishedResult model file
- gameResults route file
- Server configuration updated

**Success Criteria:**
- All endpoints respond with correct status codes
- Duplicate game+date validation works (409 conflict)
- Pagination works on GET endpoint
- Date range filtering works

---

### Phase 2: Frontend - Results Management Page & Modal
**Goal**: Build UI for viewing and publishing results

**Tasks:**
1. Create `src/components/GameResultsPage.tsx` with:
   - Datatable showing: Game Name, Published Date, Published Number, Actions (Edit, Delete)
   - Date range picker for filtering
   - Pagination controls
   - Loading and error states
   - "Publish Result" button
2. Create `src/components/PublishResultModal.tsx` with:
   - Game dropdown (populated from API)
   - Date field (default today)
   - Published Number input
   - Submit button
   - Error messages
3. Integrate into App.tsx routing
4. Add admin-only access protection

**Deliverables:**
- GameResultsPage component
- PublishResultModal component
- Route integration in App.tsx

**Success Criteria:**
- Page loads and displays results from API
- Modal opens with proper defaults
- Form submission creates results
- Date range filtering works
- Edit and delete actions work
- Duplicate attempt shows error message

---

### Phase 3: Game Creation Update (Optional but Recommended)
**Goal**: Simplify game creation UI to not require start/end dates

**Tasks:**
1. Modify `src/components/CreateGame.tsx` or update AdminDashboard to:
   - Remove startTime/endTime fields
   - Only require game name
   - Keep gameType selector
2. Update backend POST /api/games endpoint to make startTime/endTime optional
3. Update validation in backend

**Deliverables:**
- Updated CreateGame UI
- Updated backend game creation endpoint

**Success Criteria:**
- Games can be created with only name
- Backward compatibility maintained (old games still work)

---

## Verification Strategy

### Phase 1 Backend Verification

**Manual Testing (using bash/curl or Postman):**

1. **Create a result** (should succeed):
```bash
curl -X POST http://localhost:3001/api/admin/game-results \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "ObjectId",
    "publishDate": "2025-01-18",
    "publishedNumber": "123"
  }'
```

2. **Create duplicate result** (should fail with 409):
```bash
# Same gameId and publishDate - should return 409 Conflict
curl -X POST http://localhost:3001/api/admin/game-results ...
```

3. **Get results with date filter**:
```bash
curl -X GET "http://localhost:3001/api/admin/game-results?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer {token}"
```

4. **Update result**:
```bash
curl -X PUT http://localhost:3001/api/admin/game-results/{resultId} \
  -H "Authorization: Bearer {token}" \
  -d '{"publishedNumber": "456"}'
```

5. **Delete result**:
```bash
curl -X DELETE http://localhost:3001/api/admin/game-results/{resultId} \
  -H "Authorization: Bearer {token}"
```

**Helper Script** (optional - create if needed):
Create `backend/test-game-results.js` to test all endpoints programmatically

### Phase 2 Frontend Verification

1. **Visual Testing**:
   - Results datatable displays correctly
   - Pagination controls work
   - Date range filter filters results
   - Modal opens and closes properly
   - Edit/Delete buttons are visible

2. **Functional Testing**:
   - Can publish a new result
   - Cannot publish duplicate on same date (error shown)
   - Can edit existing result
   - Can delete existing result
   - Data persists after page refresh

3. **Integration Testing**:
   - Frontend calls correct backend endpoints
   - Error messages display properly
   - Loading states show during API calls

**Browser Console Testing:**
- No console errors
- Network requests show correct payloads
- JWT token included in Authorization header

---

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend Runtime | Node.js | Latest |
| Web Framework | Express.js | ^4.18.2 |
| Database | MongoDB | Cloud (Mongoose ^8.0.3) |
| Authentication | JWT | ^9.0.2 |
| Frontend | React | ^18.2.0 |
| Language | TypeScript | ^5.2.2 |
| Styling | TailwindCSS | ^3.3.5 |
| Icons | Lucide React | ^0.546.0 |
| Build Tool | Vite | ^5.0.0 |

