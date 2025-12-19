# Frontend Build & Deploy via FileZilla

## Build Frontend Locally

### Step 1: Build the Frontend
```bash
# In your local project directory:
npm run build
```

This creates a `dist` folder with optimized production files.

### Step 2: What Gets Built
The `dist` folder contains:
- `index.html` - Main HTML file
- `assets/` - CSS and JavaScript bundles
- Static assets (images, fonts, etc.)

---

## Upload via FileZilla

### Step 1: Connect to Your Server
- Host: Your server IP or domain
- Username: Your server username
- Password: Your server password
- Port: 22 (SFTP)

### Step 2: Navigate to Correct Directory
Go to: `/var/www/555-app/dist` on your server

### Step 3: Upload Contents of dist Folder
**IMPORTANT**: Upload the **CONTENTS** of your local `dist` folder, not the folder itself:

**Local Structure:**
```
dist/
├── index.html
├── assets/
│   ├── index-abc123.css
│   └── index-def456.js
└── ...
```

**Upload all these files and folders TO:**
```
/var/www/555-app/dist/
```

---

## Complete Deployment Strategy

### Option A: Full Deployment (Recommended)
Upload everything via FileZilla:

**Backend Files:**
- `backend/utils/timezone.js`
- `backend/routes/games.js`

**Frontend Build:**
- Upload entire `dist/` folder contents to `/var/www/555-app/dist/`

**Source Files (Optional):**
- `src/utils/timezone.ts` (if you want source code updated too)

### Option B: Frontend Only (If backend files already updated)
If you've already updated the backend files via other methods:
- Only upload the `dist/` folder contents
- Skip backend file uploads

---

## FileZilla Upload Steps

### 1. Local Side (Left Panel)
Navigate to your project's `dist` folder:
```
C:\path\to\your\project\dist\
```

### 2. Remote Side (Right Panel)
Navigate to server directory:
```
/var/www/555-app/dist/
```

### 3. Select and Upload
- Select all files and folders in local `dist/`
- Right-click → "Upload"
- Or drag and drop to remote side

### 4. Verify Upload
Remote side should show:
```
/var/www/555-app/dist/
├── index.html
├── assets/
│   ├── index-abc123.css
│   └── index-def456.js
└── ...
```

---

## After Upload - Server Commands

### Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/555-app/dist
sudo chmod -R 755 /var/www/555-app/dist
```

### Restart Services
```bash
sudo systemctl restart 555-app.service
sudo systemctl restart apache2  # or nginx
```

### Verify
```bash
# Check service status
sudo systemctl status 555-app.service

# Test website
curl -I http://your-domain.com
```

---

## What Gets Updated

### Frontend Changes (dist folder):
✅ **Timezone Display**: All times now show in IST
✅ **UI Components**: "Upcoming Games" section populated
✅ **API Integration**: Proper data fetching from backend
✅ **Performance**: Optimized bundles for production

### Backend Changes (if uploaded):
✅ **API Responses**: Proper game categorization
✅ **Database Queries**: Enhanced result fetching
✅ **Time Functions**: IST timezone conversion

---

## Directory Structure on Server

After successful upload, your server should have:
```
/var/www/555-app/
├── dist/                    ← Uploaded via FileZilla
│   ├── index.html
│   └── assets/
├── backend/                 ← Source code (if uploaded)
│   ├── utils/
│   └── routes/
├── src/                     ← Source code (if uploaded)
│   └── utils/
├── package.json
├── .env
└── server.js
```

---

## Troubleshooting

### If Website Shows Old Version:
1. Clear browser cache (Ctrl+F5)
2. Check if `dist` folder contents were uploaded correctly
3. Verify permissions: `sudo ls -la /var/www/555-app/dist/`

### If "Upcoming Games" Still Blank:
1. Check if backend files were uploaded
2. Verify API: `curl http://your-domain.com/api/games`
3. Check service logs: `sudo journalctl -u 555-app.service -f`

### If Permission Errors:
```bash
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app
```

---

## Quick Commands Summary

```bash
# After FileZilla upload:
cd /var/www/555-app
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist
sudo systemctl restart 555-app.service
sudo systemctl status 555-app.service
```

This approach is perfect because:
- ✅ No need to install Node.js on server for building
- ✅ Fast deployment via FileZilla
- ✅ Consistent builds across environments
- ✅ Easy to rollback (just reupload previous dist)