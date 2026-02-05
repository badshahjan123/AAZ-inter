# Order Status Standardization Plan

## Objective

Ensure that order status is derived from a single field: `order.orderStatus`.
Remove any UI-based or derived status logic.
Synchronize all pages to read from the same `order.orderStatus` value.
Restrict payment approval to Payment Verification page only.

## Current Issues

### 1. Multiple Status Fields

- `order.orderStatus` - Main status field
- `order.paymentStatus` - Payment-specific status
- `order.paymentVerified` - Boolean flag
- Derived logic in UI components

### 2. Inconsistent Status Updates

- Payment approval happens in multiple controllers
- Status transitions not centralized
- UI components derive status from multiple fields

### 3. Files Affected

#### Backend:

- `backend/models/Order.js` - Order schema
- `backend/controllers/orderController.js` - Order status updates
- `backend/controllers/manualPaymentController.js` - Payment verification
- `backend/controllers/paymentProofController.js` - Payment proof handling

#### Frontend:

- `frontend/src/pages/Profile.jsx` - User dashboard
- `frontend/src/pages/OrderDetails.jsx` - Order details page
- `frontend/src/pages/MyOrders.jsx` - My orders list
- `frontend/src/admin/pages/Orders/OrderList.jsx` - Admin order list
- `frontend/src/admin/pages/Orders/OrderDetail.jsx` - Admin order detail
- `frontend/src/admin/pages/PaymentVerification.jsx` - Payment verification page

## Implementation Steps

### Phase 1: Backend Standardization

#### 1.1 Update Order Model

- Keep `orderStatus` as single source of truth
- Keep `paymentStatus` for payment-specific tracking (PENDING, PAID, FAILED, REFUNDED)
- Remove redundant fields or clarify their purpose
- Document status flow

#### 1.2 Centralize Payment Approval

- **ONLY** `manualPaymentController.verifyPaymentProof` should approve payments
- Remove payment approval logic from `paymentProofController`
- Ensure payment approval updates both `paymentStatus` and `orderStatus`

#### 1.3 Update Order Controller

- Remove payment-related status transitions from `updateOrderStatus`
- Only allow order status updates (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Prevent status updates that should only happen via payment verification

### Phase 2: Frontend Standardization

#### 2.1 Remove Derived Status Logic

- All components should read `order.orderStatus` directly
- Remove any conditional logic that derives status from multiple fields
- Remove `order.paymentVerified` checks for status display

#### 2.2 Update User-Facing Pages

- **Profile.jsx**: Display `order.orderStatus` only
- **OrderDetails.jsx**:
  - Show status from `order.orderStatus`
  - Remove derived status logic in progress tracker
  - Show payment upload only if `orderStatus === 'PAYMENT_PENDING'`
- **MyOrders.jsx**: Display `order.orderStatus` directly

#### 2.3 Update Admin Pages

- **OrderList.jsx**: Display `order.orderStatus`
- **OrderDetail.jsx**:
  - Display `order.orderStatus`
  - Remove ability to change status to PAID (only via Payment Verification)
  - Only allow: PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED
- **PaymentVerification.jsx**:
  - This is the ONLY place to approve payments
  - Approval should update `orderStatus` from PAYMENT_PENDING → PAID

### Phase 3: Status Flow Documentation

```
Order Creation:
- COD: CREATED → PENDING (ready for admin to process)
- Bank Transfer: CREATED → PAYMENT_PENDING (waiting for proof upload)

Bank Transfer Flow:
CREATED → PAYMENT_PENDING (proof uploaded) → PAID (admin approved) → PROCESSING → SHIPPED → DELIVERED

COD Flow:
CREATED → PENDING → PROCESSING → SHIPPED → DELIVERED

Cancellation:
Any status → CANCELLED
```

## Validation Checklist

- [ ] Backend: Only Payment Verification can approve payments
- [ ] Backend: Order status updates cannot skip payment verification
- [ ] Frontend: All pages read from `order.orderStatus`
- [ ] Frontend: No derived status logic
- [ ] Frontend: Payment upload only shown when appropriate
- [ ] Admin: Cannot manually set status to PAID
- [ ] Real-time updates work correctly
- [ ] Status badges display correctly everywhere

## Testing Scenarios

1. Create COD order → Check status is PENDING
2. Create Bank Transfer order → Check status is CREATED
3. Upload payment proof → Check status changes to PAYMENT_PENDING
4. Admin approves payment → Check status changes to PAID
5. Admin updates order status → Check cannot set to PAID manually
6. Check all pages show same status value
7. Check real-time updates reflect on all pages
