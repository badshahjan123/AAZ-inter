# Payment Proof Image Display Fix

## Problem

Payment proof images were not showing in the admin panel's Payment Verification page.

## Root Causes Identified

### 1. **Missing Leading Slash in File Path**

- **Issue**: Payment proof paths were stored as `uploads/payment-proofs/filename.jpg` without a leading slash
- **Impact**: The URL construction could fail in some cases
- **Fix**: Updated `paymentController.js` to store paths with leading slash: `/uploads/payment-proofs/filename.jpg`

### 2. **Missing CORS Headers for Static Files**

- **Issue**: The `/uploads` static file serving middleware didn't include CORS headers
- **Impact**: Browsers might block cross-origin image requests from the frontend to backend
- **Fix**: Added proper CORS headers to allow cross-origin image loading

### 3. **No Error Handling/Debugging**

- **Issue**: No way to identify why images weren't loading
- **Impact**: Difficult to diagnose the problem
- **Fix**: Added `onError` and `onLoad` handlers with console logging

## Changes Made

### Backend Changes

#### 1. `backend/controllers/paymentController.js` (Line 91-94)

```javascript
// BEFORE
const relativeFilePath = `uploads/payment-proofs/${req.file.filename}`;

// AFTER
const relativeFilePath = `/uploads/payment-proofs/${req.file.filename}`;
```

**Why**: Ensures consistent path format with leading slash for proper URL construction

#### 2. `backend/server.js` (Lines 190-205)

```javascript
// BEFORE
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    next();
  },
  express.static(path.join(__dirname, "/uploads")),
);

// AFTER
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");

    // Add CORS headers for images
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    next();
  },
  express.static(path.join(__dirname, "/uploads")),
);
```

**Why**: Allows frontend to load images from backend domain without CORS errors

### Frontend Changes

#### 3. `frontend/src/admin/pages/PaymentVerification.jsx` (Lines 225-244)

Added error handling and debugging to payment proof thumbnail:

```jsx
<img
  src={getAssetUrl(payment.paymentProof, API_URL)}
  alt="Payment Proof"
  className="proof-thumbnail"
  onError={(e) => {
    console.error("Failed to load payment proof:", {
      originalPath: payment.paymentProof,
      constructedUrl: getAssetUrl(payment.paymentProof, API_URL),
      apiUrl: API_URL,
    });
    e.target.style.border = "2px solid red";
  }}
  onLoad={() => {
    console.log("Payment proof loaded successfully:", payment.paymentProof);
  }}
/>
```

#### 4. `frontend/src/admin/pages/PaymentVerification.jsx` (Lines 299-333)

Added same error handling to modal payment proof image

**Why**:

- Provides visual feedback (red border) when image fails to load
- Logs detailed debugging information to console
- Confirms successful image loads

## How It Works Now

### Image URL Construction Flow:

1. **Upload**: User uploads payment proof → Stored as `/uploads/payment-proofs/proof-123456.jpg`
2. **Fetch**: Admin fetches pending payments → Order includes `paymentProof: "/uploads/payment-proofs/proof-123456.jpg"`
3. **Display**: Frontend calls `getAssetUrl(payment.paymentProof, API_URL)`
4. **Helper**: `getAssetUrl` constructs full URL: `https://aaz-inter-production.up.railway.app/uploads/payment-proofs/proof-123456.jpg`
5. **Request**: Browser requests image from backend
6. **Serve**: Backend serves image with CORS headers
7. **Display**: Image displays in admin panel

## Testing Steps

1. **Restart Backend Server**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Check Console Logs**:
   - Open browser DevTools → Console tab
   - Navigate to Admin → Payment Verification
   - Look for:
     - ✅ "Payment proof loaded successfully" (success)
     - ❌ "Failed to load payment proof" (failure with details)

3. **Visual Inspection**:
   - Images should display normally
   - Failed images will have a red border

4. **Network Tab Check**:
   - Open DevTools → Network tab
   - Filter by "Img"
   - Check image requests:
     - Status should be `200 OK`
     - Response headers should include CORS headers

## Backward Compatibility

The fix handles both old and new payment proofs:

- **Old format**: `uploads/payment-proofs/filename.jpg` (without leading slash)
- **New format**: `/uploads/payment-proofs/filename.jpg` (with leading slash)

The `getAssetUrl` helper automatically adds a leading slash if missing (line 114 in `helpers.js`):

```javascript
const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
```

## Deployment Notes

### For Production (Railway):

1. Ensure `uploads/payment-proofs/` directory exists
2. Restart the backend service after deploying
3. Check Railway logs for any errors

### For Frontend (Vercel):

1. No changes needed - frontend automatically uses updated backend
2. Clear browser cache if images still don't show

## Troubleshooting

### If images still don't show:

1. **Check Backend Logs**:

   ```bash
   # Look for file upload confirmations
   ✅ Payment proof uploaded for Order AAZ-XXX
   ```

2. **Check File Exists**:

   ```bash
   cd backend
   ls uploads/payment-proofs/
   ```

3. **Check Browser Console**:
   - Look for CORS errors
   - Look for 404 errors
   - Check the constructed URL in error logs

4. **Check Network Tab**:
   - Verify the image URL is correct
   - Check response status code
   - Check response headers include CORS

5. **Manual URL Test**:
   - Copy the constructed URL from console
   - Paste in new browser tab
   - Image should display directly

## Additional Notes

- Images are limited to 5MB (configured in `paymentRoutes.js`)
- Allowed formats: JPEG, PNG, GIF, WebP
- Images are stored permanently until manually deleted
- No automatic cleanup implemented (consider adding in future)
