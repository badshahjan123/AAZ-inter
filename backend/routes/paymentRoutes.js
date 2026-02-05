const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadPaymentProof,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getPaymentStatus,
  getBankDetails,
} = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ============================================
// CREATE UPLOAD DIRECTORY IF NOT EXISTS
// ============================================
const uploadDir = "uploads/payment-proofs/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created uploads/payment-proofs/ directory");
}

// ============================================
// MULTER CONFIGURATION (File Upload)
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "proof-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Get bank account details
 */
router.get("/bank-details", getBankDetails);

/**
 * Get payment status for an order
 */
router.get("/status/:orderId", getPaymentStatus);

/**
 * Upload payment proof (bank transfer)
 */
router.post("/upload-proof", upload.single("screenshot"), uploadPaymentProof);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get pending payments (admin only)
 */
router.get("/pending", protect, adminOnly, getPendingPayments);

/**
 * Approve payment (admin only)
 */
router.post("/approve", protect, adminOnly, approvePayment);

/**
 * Reject payment (admin only)
 */
router.post("/reject", protect, adminOnly, rejectPayment);

module.exports = router;
