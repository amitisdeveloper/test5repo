# Feature development workflow

---

## Workflow Steps

### [x] Step: Requirements

Your job is to generate a Product Requirements Document based on the feature description,

First, analyze the provided feature definition and determine unclear aspects. For unclear aspects: - Make informed guesses based on context and industry standards - Only mark with [NEEDS CLARIFICATION: specific question] if: - The choice significantly impacts feature scope or user experience - Multiple reasonable interpretations exist with different implications - No reasonable default exists - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details

Ask up to 5 most priority clarifications to the user. Then, create the document following this template:

```
# Feature Specification: [FEATURE NAME]


## User Stories*


### User Story 1 - [Brief Title]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

## Requirements*

## Success Criteria*

```

Save the PRD into `d:\reactapps\new555v2\.zencoder\chats\038439ce-c4c9-47a9-a8ef-706bfba633c7/requirements.md`.

### [x] Step: Technical Specification

Based on the PRD in `d:\reactapps\new555v2\.zencoder\chats\038439ce-c4c9-47a9-a8ef-706bfba633c7/requirements.md`, created detailed technical specification at `d:\reactapps\new555v2\.zencoder\chats\038439ce-c4c9-47a9-a8ef-706bfba633c7/spec.md` including:
- Technical context and stack analysis
- Implementation brief with 6 key decisions
- Source code structure
- Data model and API contracts
- 3 delivery phases with verification strategies

### [x] Step: Implementation Plan

Based on the technical spec in `d:\reactapps\new555v2\.zencoder\chats\038439ce-c4c9-47a9-a8ef-706bfba633c7/spec.md`, create a detailed task plan and update `d:\reactapps\new555v2\.zencoder\chats\038439ce-c4c9-47a9-a8ef-706bfba633c7/plan.md`. Each task should have task definition, references to contracts to be used/implemented, deliverable definition and verification instructions.

---

## Detailed Implementation Tasks

### [ ] Step 1.1: Create GamePublishedResult Model

**Contracts Used**: GamePublishedResult Schema (from spec.md)

**Task Description**:
Create new Mongoose model file `backend/models/GamePublishedResult.js` with:
- Schema fields: gameId (ObjectId ref), publishDate (Date), publishedNumber (String), createdBy (ObjectId ref), timestamps
- Unique compound index on (gameId, publishDate)
- Virtual for formatted date display if needed

**Deliverable**:
- File: `backend/models/GamePublishedResult.js`
- Model exports as `GamePublishedResult`

**Verification**:
1. File exists and is syntactically valid
2. Model can be imported in Node.js REPL: `const GamePublishedResult = require('./models/GamePublishedResult')`
3. Schema has unique index: `db.gamepublishedresults.getIndexes()` shows unique index on gameId and publishDate

---

### [ ] Step 1.2: Create GameResults API Routes

**Contracts Used**: API Endpoints 1-4 (from spec.md)

**Task Description**:
Create new Express router file `backend/routes/gameResults.js` with:
1. **POST** /api/admin/game-results - Publish result with duplicate validation (409 on conflict)
2. **GET** /api/admin/game-results - List results with pagination (page, limit) and date filtering (startDate, endDate)
3. **PUT** /api/admin/game-results/:id - Update publishedNumber field only
4. **DELETE** /api/admin/game-results/:id - Soft or hard delete

All endpoints require JWT admin authentication.

**Deliverable**:
- File: `backend/routes/gameResults.js`
- Exports Express router

**Verification**:
1. Test POST with valid data - returns 201
2. Test POST duplicate game+date - returns 409 with error message
3. Test GET without filters - returns paginated results
4. Test GET with date range - filters correctly
5. Test PUT - updates result
6. Test DELETE - removes result
7. Test without auth token - returns 401

---

### [ ] Step 1.3: Update Backend Server Configuration

**Contracts Used**: Server setup from spec.md

**Task Description**:
Modify `backend/server.js` to:
1. Import new GamePublishedResult routes
2. Add new route: `app.use('/api/admin/game-results', gameResultsRoutes)`
3. Ensure auth middleware is applied

**Deliverable**:
- Updated `backend/server.js`

**Verification**:
1. Server starts without errors: `npm run dev` in backend directory
2. New endpoints are accessible at http://localhost:3001/api/admin/game-results
3. Proper error on missing auth token

---

### [ ] Step 1.4: Create Helper Endpoint for Active Games

**Contracts Used**: API Endpoint 5 - GET /api/admin/games/active-games (from spec.md)

**Task Description**:
Add new GET endpoint to `backend/routes/games.js`:
- Route: `/api/admin/games/active-games`
- Returns: Array of active games with _id, name, nickName, gameType
- Used by frontend dropdown in PublishResultModal

**Deliverable**:
- Updated `backend/routes/games.js` with new endpoint

**Verification**:
1. Endpoint returns 200 with array of games
2. Each game has _id, name, nickName, gameType fields
3. Only returns isActive: true games

---

### [ ] Step 2.1: Create PublishResultModal Component

**Contracts Used**: PublishResultModal Props (from spec.md)

**Task Description**:
Create `src/components/PublishResultModal.tsx` React component with:
1. Modal overlay (similar to existing GameModal pattern)
2. Form fields:
   - Game dropdown (populated from API)
   - Date input (type="date", default=today)
   - Published Number input (text/number)
3. Submit and Cancel buttons
4. Error message display
5. Loading state during submission
6. Close on success

**Deliverable**:
- File: `src/components/PublishResultModal.tsx`
- Exports React component

**Verification**:
1. Component renders without errors
2. Dropdown populated with games from API
3. Date field defaults to today's date
4. Form submission calls onSubmit callback
5. Error messages display properly
6. Modal closes on success

---

### [ ] Step 2.2: Create GameResults Datatable Component

**Contracts Used**: GameResultsPage Props (from spec.md)

**Task Description**:
Create `src/components/GameResultsPage.tsx` React component with:
1. Datatable with columns: Game Name, Published Date, Published Number, Actions
2. Date range picker (startDate, endDate inputs)
3. "Publish Result" button to open PublishResultModal
4. Pagination controls (page, limit, next/prev)
5. API integration:
   - GET /api/admin/game-results with filters
   - PUT for edit
   - DELETE for delete
6. Loading and error states
7. Action buttons: Edit, Delete
8. Confirmation dialog for delete

**Deliverable**:
- File: `src/components/GameResultsPage.tsx`
- Exports React component

**Verification**:
1. Page loads and displays results from API
2. Datatable renders with all 4 columns
3. Date range filter works (calls API with correct params)
4. Pagination works
5. Edit button opens modal with pre-filled data
6. Delete button shows confirmation and removes row
7. Publish Result button opens modal
8. New results appear in table after publishing

---

### [ ] Step 2.3: Integrate New Pages into App Routing

**Contracts Used**: React Router setup

**Task Description**:
Update `src/App.tsx` to:
1. Import GameResultsPage component
2. Add route: `/admin/game-results` pointing to GameResultsPage
3. Add route: `/admin/games` pointing to updated game management page
4. Add navigation menu items linking to new pages
5. Ensure ProtectedRoute wrapper for admin-only access

**Deliverable**:
- Updated `src/App.tsx`

**Verification**:
1. Can navigate to /admin/game-results
2. Page loads and requires authentication
3. Navigation menu shows new links
4. Non-admin users cannot access the page

---

### [ ] Step 3.1: Simplify Game Creation UI (Optional)

**Contracts Used**: Game Model changes (from spec.md)

**Task Description**:
Update `src/components/CreateGame.tsx` or AdminDashboard game creation to:
1. Remove startTime and endTime fields from form
2. Keep only: name, gameType
3. Update form validation
4. Update submit payload to not include times

**Deliverable**:
- Updated game creation component

**Verification**:
1. Form no longer shows time pickers
2. New games can be created with just name
3. Existing games still display correctly

---

### [ ] Step 3.2: Update Backend Game Creation Endpoint

**Contracts Used**: Game creation API from spec.md

**Task Description**:
Modify `backend/routes/games.js` POST endpoint to:
1. Make startTime, endTime optional
2. Accept either `name` or `nickName` field
3. Update validation to not require times
4. Maintain backward compatibility

**Deliverable**:
- Updated `backend/routes/games.js` POST handler

**Verification**:
1. Can create game with only name (no times)
2. Old format still works for backward compatibility
3. Games list still displays correctly

---

## Final Verification Checklist

After all tasks completed:

- [ ] All backend tests pass
- [ ] No console errors in frontend
- [ ] Can publish result for a game
- [ ] Cannot publish duplicate on same date (error shows)
- [ ] Can edit published results
- [ ] Can delete published results
- [ ] Date range filtering works
- [ ] Pagination works on results list
- [ ] New navigation links visible and functional
