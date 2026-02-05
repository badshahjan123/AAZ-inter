# Payment Proof Upload Enforced at Checkout

## 🎯 Objective

Ensure that customers paying via Bank Transfer must upload their payment screenshot and enter their transaction ID **before** placing the order. This prevents orders from being placed without accompanying payment verification.

## ✅ Changes Implemented

### 1. Checkout Page Logic (`frontend/src/pages/Checkout.jsx`)

- **Added State:** Introduced `paymentProof` (file) and `transactionId` (string) state variables.
- **Enhanced Validation:** Updated `validateForm` to strictly check for these two fields if "Bank Transfer" is selected. The form cannot be submitted without them.
- **Integrated Upload:** Modified `handleSubmit` to automatically upload the proof to the backend immediately after the order is created using the existing payment API.

### 2. User Interface Updates

- **New Section:** Added a dedicated "Upload Payment Proof" section within the Bank Transfer payment method block.
- **Input Fields:**
  - **Transaction ID:** A text input for the reference number.
  - **File Upload:** A user-friendly, drag-and-drop style file input for the screenshot.
  - **Preview:** Added an image preview so users can verify their selected file before uploading.
- **Instructions:** Updated the "Transfer Instructions" text to clearly state that the proof must be uploaded _now_ to proceed order placement.

### 3. Backend Integration

- The checkout process now seamlessly handles both the order creation and the payment proof upload in a single flow, providing a better user experience and ensuring data completeness.

### 4. Bug Fix

- **Fixed Import:** Resolved a `ReferenceError` where the `Upload` icon was missing from the imports.

## 🚀 How to Test

1.  Go to the Checkout page.
2.  Select "Bank Transfer" as the payment method.
3.  Scroll down to see the Bank Details.
4.  Notice the new "Upload Payment Proof" section below the bank details.
5.  Try to click "Place Order" without uploading - you should see validation errors.
6.  Enter a Transaction ID and select an image file.
7.  Click "Place Order" - the order should be placed, and the proof automatically attached.
