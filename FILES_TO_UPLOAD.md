# Files to Upload to Live Server

## Updated Files (Send These to Your Live Server)

Here are the specific files that contain the changes we made. Upload these to your live server:

---

## Backend Files (Server-Side)

### 1. `backend/utils/timezone.js`
**Changes**: Updated from UTC to Indian Standard Time (IST)
- Changed `timeZone: 'UTC'` to `timeZone: 'Asia/Calcutta'`
- Updated function comments to reflect IST timezone

**Upload to**: `/var/www/555-app/backend/utils/timezone.js`

### 2. `backend/routes/games.js`
**Changes**: Fixed API response format for "Upcoming Games"
- Enhanced result fetching from both `Result` and `GamePublishedResult` collections
- Now properly categorizes games as `localUpcoming` and `localWithResults`

**Upload to**: `/var/www/555-app/backend/routes/games.js`

---

## Frontend Files (Client-Side)

### 3. `src/utils/timezone.ts`
**Changes**: Updated from UTC to Indian Standard Time (IST)
- Changed `timeZone: 'UTC'` to `timeZone: 'Asia/Calcutta'`
- Updated function comments to reflect IST timezone

**Upload to**: `/var/www/555-app/src/utils/timezone.ts`

---

## File Transfer Methods

### Method 1: SCP (Secure Copy)
```bash
# From your local machine to server:
scp backend/utils/timezone.js user@your-server:/var/www/555-app/backend/utils/
scp backend/routes/games.js user@your-server:/var/www/555-app/backend/routes/
scp src/utils/timezone.ts user@your-server:/var/www/555-app/src/utils/
```

### Method 2: SFTP
```bash
# Using an SFTP client like FileZilla or WinSCP:
# Upload the 3 files to their respective directories
```

### Method 3: Git (If repository is set up)
```bash
# On your server:
cd /var/www/555-app
git pull origin main
```

### Method 4: Manual Copy-Paste
1. Open each file on your local machine
2. Copy the content
3. SSH into your server: `ssh user@your-server`
4. Edit the files using `nano` or `vi`
5. Paste the content and save

---

## Verification After Upload

After uploading the files, verify the changes are applied:

### 1. Check File Timestamps
```bash
ls -la /var/www/555-app/backend/utils/timezone.js
ls -la /var/www/555-app/backend/routes/games.js
ls -la /var/www/555-app/src/utils/timezone.ts
```

### 2. Test API Response
```bash
curl http://your-domain.com/api/games
```
Should return JSON with `localUpcoming` and `localWithResults` fields

### 3. Check Frontend Build
```bash
cd /var/www/555-app
npm run build
```

---

## Expected Changes Summary

### Before (Issues):
- "Upcoming Games" section was blank
- All times displayed in UTC
- API didn't return proper game categorization

### After (Fixed):
- "Upcoming Games" shows actual games from database
- All times display in Indian Standard Time (IST)
- API returns games properly categorized as upcoming/with results

---

## Quick Commands After Upload

```bash
# Navigate to app directory
cd /var/www/555-app

# Stop service
sudo systemctl stop 555-app.service

# Install dependencies (if package.json changed)
npm install

# Build frontend
npm run build

# Set permissions
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app

# Start service
sudo systemctl start 555-app.service

# Check status
sudo systemctl status 555-app.service
```

---

## File Contents Preview

### timezone.js/ts Changes:
```javascript
// Before:
const options = { timeZone: 'UTC' };

// After:
const options = { timeZone: 'Asia/Calcutta' };
```

### games.js Changes:
```javascript
// Before: Only fetched from GamePublishedResult
const todayResults = await GamePublishedResult.find({...});

// After: Fetches from both collections
const publishedResults = await GamePublishedResult.find({...});
const todayGameResults = await Result.find({...});
```

These changes ensure your live server will have the same improvements as your local development environment!