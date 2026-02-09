# 🚀 NETLIFY DEPLOYMENT - Complete Step-by-Step Guide

## 📋 Environment Variables for Netlify

### Frontend (Netlify) - ONLY ONE Variable Needed:

```
VITE_API_URL=https://aaz-inter-production.up.railway.app
```

**That's it! Just ONE variable for the frontend.**

---

## 🎯 COMPLETE DEPLOYMENT STEPS (Follow Exactly)

### STEP 1: Go to Netlify

1. Open browser
2. Go to: **https://app.netlify.com/**
3. Click: **Sign up** (or **Log in** if you have account)
4. Choose: **Sign up with GitHub** (easiest)
5. Authorize Netlify to access your GitHub

### STEP 2: Create New Site

1. Click: **Add new site** button (top right)
2. Click: **Import an existing project**
3. Click: **Deploy with GitHub**
4. If asked, authorize Netlify to access repositories
5. Search for: `Aaz-inter`
6. Click on: **aazinter92-max/Aaz-inter**

### STEP 3: Configure Build Settings

You'll see a configuration screen. Fill in EXACTLY:

```
Site name: [leave default or choose your own]

Branch to deploy: main

Base directory: frontend

Build command: npm run build

Publish directory: frontend/dist

Functions directory: [leave empty]
```

### STEP 4: Add Environment Variable

**IMPORTANT**: Even though it's in `netlify.toml`, add it in UI too for safety:

1. Click: **Show advanced**
2. Click: **New variable**
3. Fill in:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://aaz-inter-production.up.railway.app`
4. Click: **Add**

### STEP 5: Deploy!

1. Click: **Deploy [site-name]** button
2. You'll see "Site deploy in progress"
3. Click on the deployment to see logs
4. Wait 2-3 minutes

### STEP 6: Watch Build Logs

In the build logs, look for:

```
✅ Installing dependencies
✅ npm install
✅ npm run build
✅ vite build
✅ VITE_API_URL=https://aaz-inter-production.up.railway.app  ← MUST SEE THIS
✅ ✓ built in X.XXs
✅ Site is live
```

### STEP 7: Verify Deployment

1. Click: **Open production deploy** (or click the site URL)
2. Your site will open (URL like: `https://[random-name].netlify.app`)
3. **Open DevTools** (F12)
4. Go to **Console** tab
5. Look for:
   ```
   🔧 API Configuration: {
     mode: "production",
     VITE_API_URL: "https://aaz-inter-production.up.railway.app",
     API_BASE_URL: "https://aaz-inter-production.up.railway.app"
   }
   ```
6. Go to **Network** tab
7. Try to login or browse products
8. Verify API calls go to: `aaz-inter-production.up.railway.app`

---

## ✅ CHECKLIST - Verify These After Deployment

- [ ] Site is live (shows "Published" status)
- [ ] Can visit homepage without errors
- [ ] Can navigate to `/login` without 404
- [ ] Can refresh page without 404
- [ ] Console shows `🔧 API Configuration:` with Railway URL
- [ ] Network tab shows API calls to Railway (NOT localhost)
- [ ] Login works without CORS errors
- [ ] Products page loads data
- [ ] Categories menu loads

---

## 🎨 Optional: Custom Domain

After deployment works, you can add custom domain:

1. Go to: **Site settings** → **Domain management**
2. Click: **Add custom domain**
3. Enter your domain
4. Follow DNS configuration instructions

---

## 🔧 If Build Fails

### Common Issues:

**Issue 1: "Command not found: npm"**

- Solution: Netlify should auto-detect Node.js. If not, add build environment:
  - Go to: Site settings → Build & deploy → Environment
  - Add: `NODE_VERSION` = `18`

**Issue 2: "Module not found"**

- Solution: Check base directory is set to `frontend`

**Issue 3: "Build exceeded time limit"**

- Solution: This shouldn't happen. Contact me if it does.

---

## 📊 Summary

### What You're Deploying:

- **Repository**: `aazinter92-max/Aaz-inter`
- **Branch**: `main`
- **Base Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `frontend/dist`

### Environment Variables (Frontend):

```
VITE_API_URL=https://aaz-inter-production.up.railway.app
```

### Backend (Railway) - Already Configured:

```
FRONTEND_URL=https://aaz-international.vercel.app
MONGO_URI=[your-mongodb-uri]
JWT_SECRET=[your-jwt-secret]
PORT=5000
```

**Note**: You'll need to update `FRONTEND_URL` in Railway after Netlify deployment to your new Netlify URL.

---

## 🎯 After Successful Deployment

### Update Backend CORS:

1. Go to: **Railway Dashboard**
2. Open your backend project
3. Go to: **Variables**
4. Update: `FRONTEND_URL` to your new Netlify URL
   - Example: `https://your-site-name.netlify.app`
5. Redeploy backend

---

## 📞 Need Help?

If stuck, share:

1. Screenshot of Netlify build settings page
2. Screenshot of build logs (if failed)
3. Screenshot of browser console (if deployed but not working)

---

**Ready? Go to https://app.netlify.com/ and start!** 🚀
