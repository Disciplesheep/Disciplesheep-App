# Sow & Reap Journal - Manual Deployment Guide

## Overview
This guide explains how to manually deploy your Church Planter's Journal app to various platforms.

## Option 1: Deploy to Netlify (Recommended - Easiest)

### Prerequisites
- GitHub account
- Netlify account (free tier available)

### Steps:

1. **Push code to GitHub:**
   ```bash
   cd /app/frontend
   git init
   git add .
   git commit -m "Initial commit - Sow & Reap Journal"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sow-reap-journal.git
   git push -u origin main
   ```

2. **Deploy on Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Configure build settings:
     - **Build command:** `yarn build`
     - **Publish directory:** `build`
   - Click "Deploy site"

3. **Your app will be live at:** `https://YOUR-SITE-NAME.netlify.app`

### Custom Domain (Optional):
- In Netlify dashboard → Domain settings
- Add your custom domain
- Update DNS records as instructed

---

## Option 2: Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier available)

### Steps:

1. **Push code to GitHub** (same as Netlify step 1)

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects React settings
   - Click "Deploy"

3. **Your app will be live at:** `https://YOUR-PROJECT.vercel.app`

---

## Option 3: Deploy to GitHub Pages

### Steps:

1. **Install gh-pages package:**
   ```bash
   cd /app/frontend
   yarn add -D gh-pages
   ```

2. **Update package.json:**
   Add these lines:
   ```json
   {
     "homepage": "https://YOUR_USERNAME.github.io/sow-reap-journal",
     "scripts": {
       "predeploy": "yarn build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. **Deploy:**
   ```bash
   yarn deploy
   ```

4. **Your app will be live at:** `https://YOUR_USERNAME.github.io/sow-reap-journal`

---

## Option 4: Deploy to Your Own VPS (DigitalOcean, AWS, etc.)

### Prerequisites
- VPS with Ubuntu/Debian
- Domain name (optional)
- Basic Linux knowledge

### Steps:

1. **Build the app locally:**
   ```bash
   cd /app/frontend
   yarn build
   ```

2. **Copy build folder to your server:**
   ```bash
   scp -r build/* user@your-server.com:/var/www/sow-reap-journal/
   ```

3. **Install Nginx on server:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

4. **Configure Nginx:**
   Create `/etc/nginx/sites-available/sow-reap-journal`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/sow-reap-journal;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Enable site and restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/sow-reap-journal /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt (recommended):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Option 5: Quick Static File Server (Testing Only)

For quick local testing or sharing on local network:

```bash
cd /app/frontend
yarn build
npx serve -s build -p 3000
```

Access at `http://localhost:3000`

---

## Post-Deployment Checklist

✅ **Test all features:**
- [ ] Dashboard loads correctly
- [ ] Journal entry saves and persists
- [ ] People tracker CRUD operations work
- [ ] Expense ledger tracks budget correctly
- [ ] Reports display charts
- [ ] Mobile view works properly
- [ ] Data persists after page refresh

✅ **PWA Features:**
- [ ] Manifest.json loads (check browser DevTools → Application)
- [ ] App can be "Add to Home Screen" on mobile
- [ ] Works offline (after first visit)

✅ **Performance:**
- [ ] Page loads under 3 seconds
- [ ] Lighthouse score > 90

---

## Troubleshooting

### Issue: Blank page after deployment
**Solution:** Check that `homepage` in package.json matches your deployment URL

### Issue: Routes don't work (404 on refresh)
**Solution:** Configure your hosting provider to redirect all routes to `index.html`

**Netlify:** Create `public/_redirects` file:
```
/*    /index.html   200
```

**Vercel:** Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Issue: Data not persisting
**Solution:** Check browser console for localStorage errors. Some browsers block localStorage in private/incognito mode.

---

## Backup & Data Export (Future Enhancement)

Currently, data is stored in browser localStorage. To backup:

1. Open browser DevTools → Application → Local Storage
2. Copy the data manually
3. Future version will include export/import JSON feature

---

## Security Notes

- This app stores all data locally in the browser
- No sensitive data is transmitted to servers
- For shared device usage, consider adding a simple PIN lock feature
- Regular browser data backups recommended

---

## Support & Updates

For issues or feature requests:
- Review the code in `/app/frontend/src/`
- Check console logs for errors
- Data structure is in localStorage keys: `dailyEntries`, `peopleContacts`, `expenses`

---

## Quick Reference: Build Commands

```bash
# Install dependencies
yarn install

# Run development server
yarn start

# Build for production
yarn build

# Test production build locally
npx serve -s build
```

---

## Recommended Deployment: Netlify

**Why Netlify:**
- ✅ Free tier is generous
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git
- ✅ Global CDN
- ✅ Easy custom domain setup
- ✅ Automatic redirects for SPA routing

**Deployment time:** ~3 minutes
**Cost:** Free for personal projects
