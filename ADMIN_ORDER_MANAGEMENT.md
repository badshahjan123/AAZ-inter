# Admin Order Management System - Implementation Guide

## Overview

This document describes the comprehensive admin order management system with proper payment approval and rejection workflow, strictly separating financial verification from order fulfillment.

## System Architecture

### Separation of Concerns

1. **Order Status (`orderStatus`)**: Tracks logistics/fulfillment (Pending -> Processing -> Shipped -> Delivered).
2. **Payment Status (`paymentStatus`)**: Tracks financial verification (Pending -> Approved/Rejected).

### Order Status Flow

```
New Order Created
    ↓
[pending] (Order Status)
[pending] (Payment Status)
    ↓
Admin Verifies Payment (Payment Verification Page)
    ↓
    ├─→ [approved] (Payment Status) → Admin updates Order Status to [processing]
    └─→ [rejected] (Payment Status) → Admin may cancel Order
```

## Database Schema Changes

### Order Model (`backend/models/Order.js`)

#### orderStatus Field

- **Values**: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- **Removed**: `approved`, `rejected` (Moved to paymentStatus logic only)

#### paymentStatus Field

- **Values**: `pending`, `approved`, `rejected`, `paid`, `failed`, `refunded`

## Backend Implementation

### Payment Controller (`backend/controllers/paymentController.js`)

- `approvePayment`: Updates `paymentStatus` to `approved`. Does NOT change `orderStatus`.
- `rejectPayment`: Updates `paymentStatus` to `rejected`. Does NOT change `orderStatus`.

## Frontend Implementation

### 1. OrderManagement Component (`frontend/src/admin/pages/Orders/OrderManagement.jsx`)

- **Tab System**:
  - **All Orders**: Complete list of orders.
  - **Pending Orders**: Orders with `orderStatus: pending` (New orders).
  - **Payment Approved**: Orders with `paymentStatus: approved`.
  - **Payment Rejected**: Orders with `paymentStatus: rejected`.
- **Display**: Shows columns for BOTH `Order Status` and `Payment Status`.

### 2. OrderDetail Component (`frontend/src/admin/pages/Orders/OrderDetail.jsx`)

- **Read-Only Payment Status**: Displays current payment status badge.
- **Workflow Control**: Dropdown for `orderStatus` (Pending, Processing, Shipped, Delivered, Cancelled).
- **Payment Actions**: Removed. Admins must use the **Payment Verification** page for approval/rejection.

## Status Transition Rules

### Valid Order Transitions

```javascript
pending → [processing, cancelled]
processing → [shipped, cancelled]
shipped → [delivered, cancelled]
```

## Testing Checklist

### Frontend Tests

- [ ] Verify "All Orders" tab shows all orders.
- [ ] Verify "Pending" tab shows only new/pending orders.
- [ ] Verify Order Detail page does NOT have "Approve Payment" buttons.
- [ ] Verify Order Detail page shows "Payment Status" badge.
- [ ] Verify Order Status dropdown only has valid workflow options.

### Backend Tests

- [ ] Verify approving payment only updates `paymentStatus`.
- [ ] Verify rejecting payment only updates `paymentStatus`.

## API Reference

### Order Endpoints

```
GET    /api/orders                    - Get all orders
PUT    /api/orders/:id/status         - Update order status (fulfillment only)
```

### Payment Endpoints

```
POST   /api/payments/approve          - Approve payment (updates paymentStatus)
POST   /api/payments/reject           - Reject payment (updates paymentStatus)
```
