# Live Server Update Guide

## Updating Existing Live Server with New Changes

Since you already have the project deployed on your Linux server, here's the step-by-step process to upload the changes we made (timezone fixes and API improvements):

---

## Changes Made (To Deploy)

1. **Timezone Conversion**: UTC → Indian Standard Time (IST)
2. **API Fix**: "Upcoming Games" section now works properly
3. **Database Integration**: Fixed data fetching from MongoDB

---

## Update Procedure

### Step 1: Backup Current Installation
```bash
# Navigate to your app directory
cd /var/www/555-app

# Create backup
sudo cp -r . ../555-app-backup-$(date +%Y%m%d)
echo "Backup created at: /var/www/555-app-backup-$(date +%Y%m%d)"
```

### Step 2: Stop the Application Service
```bash
# Stop the running service
sudo systemctl stop 555-app.service

# Verify it's stopped
sudo systemctl status 555-app.service
```

### Step 3: Update Source Code

**Option A: If you have git repository**
```bash
cd /var/www/555-app
git pull origin main
```

**Option B: Manual file upload**
```bash
# Upload the following changed files to your server:

# Backend files:
# - backend/utils/timezone.js
# - backend/routes/games.js

# Frontend files:
# - src/utils/timezone.ts

# Use SCP, SFTP, or your preferred method to upload these files
```

### Step 4: Install Dependencies (if package.json changed)
```bash
cd /var/www/555-app
npm install
```

### Step 5: Build Frontend (if frontend changed)
```bash
cd /var/www/555-app
npm run build
```

### Step 6: Set Correct Permissions
```bash
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app
```

### Step 7: Start the Application
```bash
# Start the service
sudo systemctl start 555-app.service

# Enable auto-start (if not already enabled)
sudo systemctl enable 555-app.service

# Check status
sudo systemctl status 555-app.service
```

### Step 8: Verify Updates
```bash
# Check if service is running
sudo systemctl status 555-app.service

# Test API endpoint
curl http://localhost:3001/api/games

# Check logs for any errors
sudo journalctl -u 555-app.service -f --since "1 minute ago"
```

---

## Quick Commands Summary

```bash
# Complete update sequence:
cd /var/www/555-app
sudo systemctl stop 555-app.service
git pull origin main  # or upload files manually
npm install
npm run build
sudo chown -R www-data:www-data /var/www/555-app
sudo systemctl start 555-app.service
sudo systemctl status 555-app.service
```

---

## Verification Steps

### 1. Check Service Status
```bash
sudo systemctl status 555-app.service
```
Should show: `active (running)`

### 2. Test API Response
```bash
curl http://localhost:3001/api/games
```
Should return JSON with `localUpcoming` and `localWithResults` fields

### 3. Check Logs
```bash
sudo journalctl -u 555-app.service -f
```
Look for any error messages

### 4. Test Website
Visit your domain in browser:
- Check if "Upcoming Games" shows games (not blank)
- Verify times are in IST format
- Test admin login functionality

---

## Troubleshooting

### If Service Won't Start
```bash
# Check detailed logs
sudo journalctl -u 555-app.service -n 50

# Check if port is already in use
sudo lsof -i :3001

# Restart if needed
sudo systemctl restart 555-app.service
```

### If Frontend Build Fails
```bash
# Clear node modules and reinstall
cd /var/www/555-app
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If Database Connection Issues
```bash
# Test MongoDB connection
curl http://localhost:3001/api/health
# Should return: {"database": "connected"}
```

### If Permissions Issues
```bash
sudo chown -R www-data:www-data /var/www/555-app
sudo chmod -R 755 /var/www/555-app
```

---

## Rollback (If Something Goes Wrong)

```bash
# Stop current service
sudo systemctl stop 555-app.service

# Restore from backup
sudo rm -rf /var/www/555-app
sudo cp -r /var/www/555-app-backup-YYYYMMDD /var/www/555-app

# Restart service
sudo systemctl start 555-app.service
```

Replace `YYYYMMDD` with your backup date.

---

## Expected Results After Update

✅ **"Upcoming Games" section**: Will show actual games instead of being blank
✅ **Timezone**: All times will display in Indian Standard Time (IST)
✅ **API Response**: Games API will return proper categorized data
✅ **Database Integration**: System will fetch real data from MongoDB

The update should be seamless and your users will immediately see the improvements!