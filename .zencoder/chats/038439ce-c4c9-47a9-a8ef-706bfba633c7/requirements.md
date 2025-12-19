# Feature Specification: Game Result Publishing System

## Overview
Transform the game management system from time-bound entries (with start/end dates) to recurring daily result publication. Games are created once and results are published on a per-day basis, allowing the same game to have different results for each day.

---

## User Stories

### User Story 1 - Create Recurring Game Entry
**Actor**: Admin  
**As an** admin, **I want to** create a game entry with only a game name, **so that** I can publish results for this game on any day without re-creating the game.

**Acceptance Scenarios**:
1. **Given** the game creation form, **When** I enter a game name and submit, **Then** the game is created and available for result publishing
2. **Given** a game exists, **When** I attempt to publish a result for that game, **Then** the game appears in the game dropdown

---

### User Story 2 - Publish Daily Game Results
**Actor**: Admin  
**As an** admin, **I want to** publish a lottery number for a specific game on a specific date, **so that** I can record the daily results for ongoing games.

**Acceptance Scenarios**:
1. **Given** the publish result modal, **When** I select a game, enter a date, and enter a number, **Then** the result is created and appears in the datatable
2. **Given** I published a result for game X on 2025-01-15, **When** I try to publish another result for game X on the same date, **Then** I receive an error preventing the duplicate entry
3. **Given** a result is published, **When** I close the modal, **Then** the datatable refreshes showing the new entry with game name and publish date

---

### User Story 3 - View Published Results
**Actor**: Admin  
**As an** admin, **I want to** view all published game results in a datatable with filtering options, **so that** I can review historical results and manage them.

**Acceptance Scenarios**:
1. **Given** the results page, **When** it loads, **Then** I see a datatable displaying all published results with columns: Game Name, Published Date, Published Number, Actions
2. **Given** the results datatable, **When** I use the date range picker, **Then** the results are filtered to show only entries within the selected date range
3. **Given** the results datatable, **When** I sort by any column, **Then** the results are sorted accordingly

---

### User Story 4 - Manage Published Results
**Actor**: Admin  
**As an** admin, **I want to** edit or delete previously published results, **so that** I can correct mistakes or remove outdated entries.

**Acceptance Scenarios**:
1. **Given** a published result in the datatable, **When** I click the edit action, **Then** an edit modal opens with pre-filled game, date, and number fields
2. **Given** the edit modal, **When** I modify the number and submit, **Then** the result is updated and the datatable reflects the change
3. **Given** a published result, **When** I click the delete action and confirm, **Then** the result is removed from the datatable
4. **Given** I edit a result, **When** the new number conflicts with existing validation rules, **Then** an appropriate error message is shown

---

## Requirements

### Functional Requirements
1. **Game Management Changes**
   - Remove `start_date` and `end_date` fields from game creation
   - Game model contains only: `id`, `name`, `created_at` (and standard audit fields)
   - Existing games with start/end dates should be handled (migration or deprecation strategy)

2. **Result Publishing**
   - Create new data model: `GameResult` with fields: `id`, `game_id`, `publish_date`, `published_number`, `created_at`, `updated_at`
   - Unique constraint: (`game_id`, `publish_date`) to enforce one result per game per day
   - Create API endpoint to publish a result: `POST /api/admin/game-results`
   - Create API endpoint to retrieve results with pagination: `GET /api/admin/game-results`
   - Create API endpoint to update a result: `PUT /api/admin/game-results/{id}`
   - Create API endpoint to delete a result: `DELETE /api/admin/game-results/{id}`

3. **Admin UI - Results Management Page**
   - Datatable with columns: Game Name, Published Date, Published Number, Actions (Edit, Delete)
   - "Publish Result" button to open modal
   - Date range picker for filtering results
   - Sorting functionality for all columns
   - Pagination support

4. **Admin UI - Publish Result Modal**
   - Game Name dropdown (populated from all games)
   - Date field (default: today's date, allowing selection of past/future dates)
   - Published Number text field (numeric input)
   - Submit button
   - Proper error handling and validation messages

5. **Validation Rules**
   - Game name is required when creating a game
   - Game name in result publishing is required
   - Published number is required and must be numeric
   - Published date is required
   - Prevent duplicate publish: Check for existing result with same game_id and publish_date before insertion/update
   - Return clear error message: "A result for this game already exists on this date"

### Non-Functional Requirements
1. Database changes should include migration scripts
2. API should return consistent error responses with meaningful messages
3. Frontend should show loading states during API calls
4. Datatable should support 100+ records with pagination

### Security Requirements
1. All endpoints should require admin authentication
2. Ensure admin-only access to result management features

---

## Success Criteria

1. ✓ Games can be created with only a name (no start/end date)
2. ✓ Results can be published for any game on any date via modal
3. ✓ Only one result per game per day is allowed (validated and enforced)
4. ✓ Results are displayed in a filterable, sortable datatable
5. ✓ Date range filtering works on the results list
6. ✓ Published results can be edited to correct errors
7. ✓ Published results can be deleted
8. ✓ Duplicate publish attempt shows error message
9. ✓ All API endpoints return appropriate HTTP status codes and error messages
10. ✓ Frontend UI is responsive and user-friendly
