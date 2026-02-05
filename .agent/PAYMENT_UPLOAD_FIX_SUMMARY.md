# Payment Upload Integration Fix

## 🐛 Issues Identified

1. **Incorrect API Endpoint:** The checkout code was trying to PUT to `/api/payments/${orderId}/pay`, but the backend route is `POST /api/payments/upload-proof`.
2. **Incorrect Form Data:** The backend expects the file field to be named `screenshot` and `orderId` to be in the body, but the frontend was sending `paymentProof` and omitting `orderId`.
3. **Missing Admin View:** Because the upload failed, the `verificationStatus` was never set to "PENDING", so the orders didn't appear in the Admin Payment Verification list.

## ✅ Fixes Implemented

### 1. Checkout Page (`frontend/src/pages/Checkout.jsx`)

- **Updated Fetch URL:** Changed endpoint to `http://localhost:5000/api/payments/upload-proof`.
- **Corrected Method:** Changed from `PUT` to `POST`.
- **Fixed Form Data:**
  - Appended `orderId` (Required by backend).
  - Renamed file field from `paymentProof` to `screenshot`.
  - Removed manual `Content-Type` header (letting browser set boundary).
  - Removed Auth header (route is public).

### 2. Expected Behavior

- When "Place Order" is clicked, the order is created first.
- Immediately after, the payment proof is uploaded to the correct endpoint.
- Returns 200 OK.
- Backend sets `orderStatus` to "PAYMENT_PENDING" and `verificationStatus` to "PENDING".
- **Result:** The order will now correctly appear in the Admin Panel > Payment Verification page.

## 🚀 Verification

1. Place a new Bank Transfer order with proof.
2. Check the Network tab to ensure `upload-proof` call returns 200.
3. Access Admin Panel > Payment Verification.
4. The new order should now be visible for approval.
