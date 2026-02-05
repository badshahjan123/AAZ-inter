# Admin Dashboard Revenue Fix

## 🐛 Issue Identified

- **Discrepancy:** The "Sales Analytics" bar chart showed correct sales volume (~6k), but the "Total Revenue" card showed 0.
- **Cause:** The "Total Revenue" calculation was too strict, counting only orders with `PAID` status or `DELIVERED`, etc. It excluded `CREATED` (COD) and `PAYMENT_PENDING` (Bank Transfer) orders. Use effectively expects to see "Total Order Value" (GMV) in the dashboard.

## ✅ Fix Implemented

### 1. Order Controller (`backend/controllers/orderController.js`)

- **Updated Logic:** Simplified the revenue aggregation query to sum the `totalAmount` of **all** orders where `orderStatus` is NOT `CANCELLED`.
- **Result:**
  - Pending Bank Transfers are now counted.
  - COD orders are now counted.
  - "Total Revenue" card now matches the "Sales Analytics" chart.

## 🚀 Verification

1. Refresh the Admin Dashboard.
2. The "Total Revenue" card should now show the sum of all active orders (e.g., Rs. 6,000 for the single order shown).
