# 🚨 URGENT: Vercel Environment Variable Setup

## The Problem

Vercel is serving an OLD build that has `localhost:5000` hardcoded in the bundled JavaScript file (`index-Bjqpg8fy.js`). This was created BEFORE our fixes.

## ✅ SOLUTION: Set Environment Variable in Vercel Dashboard

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Select Your Project**
   - Find and click: `aaz-international` (or whatever your project is named)

3. **Go to Settings**
   - Click the **Settings** tab at the top

4. **Open Environment Variables**
   - In the left sidebar, click: **Environment Variables**

5. **Add New Variable**
   - Click: **Add New** button
   - Fill in:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://aaz-inter-production.up.railway.app`
     - **Environments**: Check ALL three boxes:
       - ✅ Production
       - ✅ Preview
       - ✅ Development
   - Click: **Save**

6. **Trigger New Deployment**
   - Go to the **Deployments** tab
   - Find the LATEST deployment (should be at the top)
   - Click the **...** (three dots menu) on the right
   - Select: **Redeploy**
   - **IMPORTANT**: UNCHECK "Use existing Build Cache"
   - Click: **Redeploy** button

7. **Wait for Build to Complete**
   - Watch the deployment logs
   - Should take 2-3 minutes
   - Look for: "Build Completed"

8. **Verify the Fix**
   - Visit: https://aaz-international.vercel.app
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Open DevTools → Console
   - Should see: `🔧 API Configuration:` with Railway URL
   - Check Network tab - API calls should go to Railway

## 🎯 What to Look For

### Before Fix (Current):

```
Access to fetch at 'http://localhost:5000/api/categories'
```

### After Fix (Expected):

```
🔧 API Configuration: {
  mode: "production",
  VITE_API_URL: "https://aaz-inter-production.up.railway.app",
  API_BASE_URL: "https://aaz-inter-production.up.railway.app"
}
```

## ⚠️ Common Mistakes to Avoid

1. ❌ Don't forget to UNCHECK "Use existing Build Cache"
2. ❌ Don't skip the hard refresh (Ctrl+Shift+R)
3. ❌ Make sure you selected ALL environments (Production, Preview, Development)
4. ❌ Don't use `http://` - use `https://` for the Railway URL

## 📸 Screenshot Guide

If you need visual help, the Vercel UI looks like this:

```
Settings → Environment Variables → Add New

┌─────────────────────────────────────────┐
│ Key: VITE_API_URL                       │
├─────────────────────────────────────────┤
│ Value: https://aaz-inter-production... │
├─────────────────────────────────────────┤
│ Environments:                           │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
└─────────────────────────────────────────┘
```

## 🆘 If Still Not Working

1. Check Vercel build logs for errors
2. Verify the environment variable was saved
3. Ensure Railway backend is running
4. Check Railway logs for incoming requests
5. Try deploying from a fresh commit

## 📞 Need Help?

If you're stuck, share:

- Screenshot of Vercel environment variables page
- Screenshot of latest deployment logs
- Any error messages from the build process
