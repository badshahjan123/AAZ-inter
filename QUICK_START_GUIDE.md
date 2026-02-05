# QUICK START GUIDE - Bank Transfer + COD Payment System

## ✅ What's New

The AAZ International platform now supports **BANK TRANSFER** and **CASH ON DELIVERY (COD)** only. Card payments (Stripe) have been completely removed.

---

## 🚀 GETTING STARTED

### 1. Backend Setup

```bash
cd backend

# Install dependencies (already done)
npm install

# Update .env with bank details
# BANK_NAME=Your Bank Name
# ACCOUNT_HOLDER=Your Company Name
# ACCOUNT_NUMBER=XXXXXXXXXXXXXXX
# BANK_CODE=XXXX
# IBAN=PKXX XXXX XXXX XXXX XXXX XXXX

# Start server
npm start
```

**Expected Output:**

```
✅ Server running on port 5000
✅ Database connected
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start dev server
npm run dev
```

**Expected Output:**

```
✅ VITE v5.x.x ready in XXX ms
✅ Local: http://localhost:5173
```

---

## 🧪 TESTING SCENARIOS

### Test 1: Bank Transfer Order

1. **Go to Checkout:**
   - Navigate to http://localhost:5173/checkout
   - Add items to cart first

2. **Place Order:**
   - Fill customer details
   - Select "Bank Transfer" payment method
   - See bank account details appear
   - Click "Place Order"

3. **Expected Result:**
   - Order created with status: `CREATED`
   - Redirected to order confirmation page

4. **Upload Payment Proof:**
   - Go to order details page
   - See "Upload Payment Proof" form
   - Enter transaction ID (e.g., "TXN123456789")
   - Upload a screenshot (JPG/PNG, <5MB)
   - Click "Upload Payment Proof"

5. **Expected Result:**
   - Success message appears
   - Order status changes to: `PAYMENT_PENDING`

### Test 2: Admin Payment Verification

1. **Access Admin Panel:**
   - Navigate to admin payment verification page
   - Login with admin credentials

2. **View Pending Payments:**
   - See list of pending bank transfers
   - Click on order to review details
   - See payment screenshot in modal

3. **Approve Payment:**
   - Click "Approve" button
   - Verify order status changes to: `PAID`
   - Success notification appears

4. **Test Rejection:**
   - Place another bank transfer order
   - Upload payment proof
   - Go to admin verification
   - Click "Reject"
   - Enter rejection reason
   - Click "Reject" button
   - Verify order returns to `PAYMENT_PENDING`
   - Customer can re-upload

### Test 3: Cash on Delivery

1. **Place COD Order:**
   - Go to checkout
   - Select "Cash on Delivery"
   - Fill customer details
   - Click "Place Order"

2. **Expected Result:**
   - Order created with status: `CREATED`
   - NO payment proof upload needed
   - Order ready for processing

---

## 📊 API Testing (with cURL or Postman)

### Get Bank Details

```bash
curl http://localhost:5000/api/payments/bank-details
```

**Response:**

```json
{
  "bankName": "ABC Bank Limited",
  "accountHolder": "AAZ Medical Equipment",
  "accountNumber": "1234567890",
  "bankCode": "1234",
  "iban": "PKXX XXXX 0001 2345 6789 0",
  "instructions": "Please transfer the exact amount..."
}
```

### Upload Payment Proof

```bash
curl -X POST http://localhost:5000/api/payments/upload-proof \
  -F "orderId=ORDER_ID_HERE" \
  -F "transactionId=TXN123456789" \
  -F "screenshot=@/path/to/image.jpg"
```

### Get Pending Payments (Admin)

```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/payments/pending
```

### Approve Payment (Admin)

```bash
curl -X POST http://localhost:5000/api/payments/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID_HERE"}'
```

### Reject Payment (Admin)

```bash
curl -X POST http://localhost:5000/api/payments/reject \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"ORDER_ID_HERE",
    "reason":"Payment amount mismatch"
  }'
```

---

## 🔍 VERIFICATION CHECKLIST

### Backend

- [ ] Server starts without errors
- [ ] No Stripe references in console
- [ ] Database connection successful
- [ ] Payment routes working
- [ ] Upload directory exists

### Frontend

- [ ] Checkout page loads
- [ ] Bank Transfer option visible
- [ ] COD option visible
- [ ] Bank details display correctly
- [ ] Payment proof upload form works

### Database

- [ ] Order has `orderStatus` field (not `paymentStatus`)
- [ ] Order has `paymentMethod` enum: ["bank", "cod"]
- [ ] Order has `transactionId`, `paymentProof` fields
- [ ] Order has `verificationStatus` field

### File System

- [ ] `backend/uploads/payment-proofs/` directory exists
- [ ] Test image upload creates file
- [ ] Files are accessible via API

---

## 🐛 TROUBLESHOOTING

### Issue: "Stripe is not defined" error

**Solution:** Already fixed! Stripe imports have been completely removed.

### Issue: Bank details not showing

**Solution:** Check `.env` file has:

```
BANK_NAME=ABC Bank Limited
ACCOUNT_HOLDER=AAZ Medical Equipment
ACCOUNT_NUMBER=1234567890
BANK_CODE=1234
IBAN=PKXX XXXX 0001 2345 6789 0
```

### Issue: File upload fails

**Solution:**

- Check file size (<5MB)
- Check file type (JPG, PNG, GIF, WebP only)
- Ensure `uploads/payment-proofs/` directory exists
- Check folder permissions

### Issue: Admin cannot approve payments

**Solution:**

- Verify user is admin (check `isAdmin` field in database)
- Verify JWT token is valid
- Check browser console for error details

### Issue: Order status not updating

**Solution:**

- Refresh page after action
- Check server logs for errors
- Verify MongoDB connection
- Check order ID is valid ObjectId

---

## 📋 DATA STRUCTURE

### Order Document

```javascript
{
  _id: ObjectId,
  orderNumber: String,
  customerName: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  products: [{product, quantity, price}],
  totalAmount: Number,

  // Payment Fields
  paymentMethod: "bank" | "cod",

  // Bank Transfer Fields (if paymentMethod === "bank")
  transactionId: String,           // Required for bank transfer
  paymentProof: String,            // Path to uploaded screenshot
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED",
  rejectionReason: String,         // If rejected
  verifiedBy: ObjectId,            // Admin who verified
  verifiedAt: Date,                // When verified

  // Status
  orderStatus: "CREATED" | "PAYMENT_PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED",
  paidAt: Date,

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 NEXT STEPS

1. **Customize Bank Details:**
   - Update `BANK_NAME`, `ACCOUNT_NUMBER`, `IBAN` in `.env`
   - Update instructions text

2. **Setup Email Notifications:**
   - Add email on payment approval
   - Add email on payment rejection with reason

3. **Configure Admin Dashboard:**
   - Add PaymentVerification page to admin routes
   - Setup admin navigation menu

4. **Production Deployment:**
   - Test with real bank transfers
   - Monitor payment verification rate
   - Setup monitoring/alerts

5. **Future Integrations:**
   - Bank API auto-reconciliation
   - SMS/WhatsApp notifications
   - Payment analytics dashboard

---

## 📞 QUICK REFERENCE

| Action                    | Location             | Status     |
| ------------------------- | -------------------- | ---------- |
| Place Bank Transfer Order | Checkout Page        | ✅ Working |
| Upload Payment Proof      | Order Details        | ✅ Working |
| Admin View Pending        | Admin Panel          | ✅ Working |
| Admin Approve             | Payment Verification | ✅ Working |
| Admin Reject              | Payment Verification | ✅ Working |
| Place COD Order           | Checkout Page        | ✅ Working |

---

## 🚨 IMPORTANT NOTES

1. **No Stripe Dependency:** The system no longer depends on Stripe. Card payments are completely removed.

2. **Manual Verification:** Payment verification is done manually by admin. Consider adding automation in the future.

3. **File Security:** Uploaded payment proofs are stored in `/uploads/payment-proofs/` directory. Consider backing them up.

4. **Email Integration:** Currently, notifications are sent via console logs. Setup actual email notifications in production.

5. **Testing Images:** For testing, you can use any image file as payment proof. In production, customers should upload actual bank transfer screenshots.

---

**Ready to go! 🎉**

Test the system thoroughly before deploying to production.

Questions? Check `/BANK_TRANSFER_IMPLEMENTATION.md` for detailed documentation.
