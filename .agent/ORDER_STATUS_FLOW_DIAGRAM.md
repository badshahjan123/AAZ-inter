# Order Status Flow Diagram

## Order Status Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORDER CREATION                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    CREATED      │
                    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼────────┐
            │   COD Order    │  │ Bank Transfer │
            └───────┬────────┘  └──────┬────────┘
                    │                   │
                    │                   ▼
                    │         ┌──────────────────┐
                    │         │ PAYMENT_PENDING  │ ◄─── User uploads proof
                    │         └──────────────────┘
                    │                   │
                    │                   ▼
                    │         ┌──────────────────────────────────┐
                    │         │  Payment Verification Page       │
                    │         │  (ONLY place to approve payment) │
                    │         └──────────────────────────────────┘
                    │                   │
                    │         ┌─────────┴─────────┐
                    │         │                   │
                    │    ┌────▼────┐      ┌──────▼────────┐
                    │    │  PAID   │      │   REJECTED    │
                    │    └────┬────┘      └──────┬────────┘
                    │         │                   │
                    │         │                   └──► Back to PAYMENT_PENDING
                    │         │                        (User can re-upload)
                    └─────────┴──────────┐
                                         │
                                         ▼
                              ┌──────────────────┐
                              │   PROCESSING     │ ◄─── Admin processes order
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │    SHIPPED       │ ◄─── Admin ships order
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │   DELIVERED      │ ◄─── Order delivered
                              └──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │   COMPLETED      │
                              └──────────────────┘

                    ┌──────────────────────────┐
                    │     CANCELLED            │ ◄─── Can cancel from any status
                    └──────────────────────────┘
```

## Status Transitions (Allowed)

### COD Orders

```
CREATED → PENDING → PROCESSING → SHIPPED → DELIVERED → COMPLETED
   │                                                          │
   └──────────────────► CANCELLED ◄─────────────────────────┘
```

### Bank Transfer Orders

```
CREATED → PAYMENT_PENDING → PAID → PROCESSING → SHIPPED → DELIVERED → COMPLETED
   │            │             │                                            │
   │            └─► REJECTED ─┘                                            │
   └────────────────────────────────► CANCELLED ◄──────────────────────────┘
```

## Payment Verification Flow (Bank Transfer Only)

```
┌──────────────────────────────────────────────────────────────────┐
│  1. User Creates Order (paymentMethod: "bank")                   │
│     orderStatus: CREATED                                         │
│     paymentStatus: PENDING                                       │
│     verificationStatus: null                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. User Uploads Payment Proof                                   │
│     orderStatus: PAYMENT_PENDING                                 │
│     paymentStatus: PENDING                                       │
│     verificationStatus: PENDING                                  │
│     transactionId: "ABC123"                                      │
│     paymentProof: "uploads/payment-proofs/proof-123.jpg"         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Admin Reviews on Payment Verification Page                   │
│     - Views payment proof image                                  │
│     - Checks transaction ID                                      │
│     - Verifies amount matches                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐      ┌─────▼─────┐
              │  APPROVE  │      │  REJECT   │
              └─────┬─────┘      └─────┬─────┘
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  orderStatus: PAID       │  │  orderStatus: PAYMENT_   │
│  paymentStatus: PAID     │  │    PENDING               │
│  verificationStatus:     │  │  paymentStatus: PENDING  │
│    APPROVED              │  │  verificationStatus:     │
│  verifiedBy: admin._id   │  │    REJECTED              │
│  verifiedAt: timestamp   │  │  rejectionReason: "..."  │
│  paidAt: timestamp       │  │  verifiedBy: admin._id   │
└──────────────────────────┘  └──────────────────────────┘
            │                              │
            ▼                              │
    Ready for PROCESSING                   │
                                          │
                                          ▼
                                User can re-upload proof
```

## Field Usage

### order.orderStatus (PRIMARY - Single Source of Truth)

- **Purpose:** Main order lifecycle tracking
- **Used By:** ALL UI components, progress trackers, order lists
- **Display:** Shown to users everywhere
- **Updates:** Via order status API or payment approval API

### order.paymentStatus (SECONDARY - Internal Tracking)

- **Purpose:** Payment-specific tracking for analytics
- **Used By:** Backend revenue calculations, reports
- **Display:** NOT shown to users (internal only)
- **Updates:** Automatically synced with orderStatus changes

### order.verificationStatus (TERTIARY - Workflow Only)

- **Purpose:** Payment proof verification workflow
- **Used By:** Payment Verification page only
- **Display:** Shown only on Payment Verification page
- **Updates:** Only via payment approval/rejection API

## Access Control

### Payment Approval (RESTRICTED)

```
✅ ALLOWED:
- Payment Verification Page → POST /api/payments/approve
- Admin role required
- Updates orderStatus to PAID

❌ NOT ALLOWED:
- Order Detail Page → Cannot set status to PAID manually
- Regular status update API → Cannot transition to PAID
- Frontend cannot directly set PAID status
```

### Order Status Updates (GENERAL)

```
✅ ALLOWED:
- Order Detail Page → PUT /api/orders/:id/status
- Admin role required
- Can set: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED

❌ NOT ALLOWED:
- Cannot set PAID (must use Payment Verification)
- Cannot skip required transitions
- Cannot move from DELIVERED back to PROCESSING
```

## UI Components Status Display

### All Components Use: `order.orderStatus`

```jsx
// ✅ CORRECT - Single source of truth
<span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
  {formatStatus(order.orderStatus)}
</span>

// ❌ WRONG - Derived logic
<span className={`status-badge ${order.paymentVerified ? 'paid' : 'pending'}`}>
  {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
</span>
```

### Progress Stepper Logic

```jsx
// ✅ CORRECT - Based on orderStatus only
<div className={`step ${['PAID', 'PROCESSING', 'SHIPPED'].includes(order.orderStatus) ? 'completed' : ''}`}>

// ❌ WRONG - Based on multiple fields
<div className={`step ${order.paymentVerified && order.paymentStatus === 'PAID' ? 'completed' : ''}`}>
```

## Real-time Updates

### Socket.io Events

```javascript
// When payment is approved
io.emit("paymentApproved", {
  orderId: order._id,
  orderNumber: order.orderNumber,
  message: "Payment approved",
});

// When order status changes
io.emit("orderStatusUpdate", {
  orderId: order._id,
  status: order.orderStatus, // ← Single source of truth
  isDelivered: order.isDelivered,
  deliveredAt: order.deliveredAt,
});
```

### Frontend Listeners

```javascript
// ✅ CORRECT - Update orderStatus
socket.on("orderStatusUpdate", (data) => {
  setOrder((prev) => ({
    ...prev,
    orderStatus: data.status, // ← Single source of truth
  }));
});

// ❌ WRONG - Update multiple status fields
socket.on("orderStatusUpdate", (data) => {
  setOrder((prev) => ({
    ...prev,
    orderStatus: data.status,
    paymentStatus: data.paymentStatus,
    paymentVerified: data.verified,
  }));
});
```
