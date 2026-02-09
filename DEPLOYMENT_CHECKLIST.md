# 🚀 Deployment Checklist

## Before Deploying

- [ ] All optimizations applied (check OPTIMIZATION_SUMMARY.md)
- [ ] Backend API is running and accessible
- [ ] Environment variables ready

## Build & Deploy

### Step 1: Build
```bash
cd frontend
npm install
npm run build
```

### Step 2: Test Build Locally (Optional)
```bash
npm run preview
# Open http://localhost:4173
```

### Step 3: Deploy to Netlify

**Option A: Drag & Drop**
1. Go to https://app.netlify.com/drop
2. Drag the `frontend/dist` folder
3. Done!

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=frontend/dist
```

**Option C: GitHub Integration**
1. Push code to GitHub
2. Connect repo in Netlify
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

## After Deploying

### Step 4: Set Environment Variables
In Netlify Dashboard > Site Settings > Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
```

### Step 5: Test Performance
- [ ] Open site in incognito mode
- [ ] Check Network tab (should see code splitting)
- [ ] Test navigation (should be instant after first load)
- [ ] Check console for errors

### Step 6: Performance Testing
Run these tests:
- [ ] Google PageSpeed Insights: https://pagespeed.web.dev/
- [ ] GTmetrix: https://gtmetrix.com/
- [ ] WebPageTest: https://www.webpagetest.org/

**Target Scores:**
- Performance: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 500KB

## Verification Checklist

- [ ] Home page loads in < 2 seconds
- [ ] Products page loads in < 2 seconds
- [ ] Navigation is instant (lazy loading working)
- [ ] Images load properly
- [ ] Cart functionality works
- [ ] Authentication works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All routes work (SPA redirects)

## Common Issues & Fixes

### Issue: 404 on page refresh
**Fix:** Ensure `netlify.toml` is in frontend folder with redirects

### Issue: API calls failing
**Fix:** Check VITE_API_URL environment variable in Netlify

### Issue: Images not loading
**Fix:** Verify backend CORS allows Netlify domain

### Issue: Still slow
**Fix:** 
1. Check backend response times
2. Verify all optimizations applied
3. Check Network tab for large files
4. Ensure build was successful

## Performance Monitoring

After deployment, monitor:
- [ ] Netlify Analytics (if enabled)
- [ ] Google Analytics page load times
- [ ] User feedback on speed

## Rollback Plan

If issues occur:
1. Keep previous deployment active in Netlify
2. Can instantly rollback in Netlify Dashboard > Deploys
3. Or redeploy previous version

## Success Criteria

✅ Initial load < 2 seconds
✅ Navigation instant
✅ No console errors
✅ All features working
✅ Mobile responsive
✅ PageSpeed score 90+

---

**Need Help?**
- Check OPTIMIZATION_SUMMARY.md for details
- Check PERFORMANCE.md for troubleshooting
- Review Netlify deploy logs for errors
