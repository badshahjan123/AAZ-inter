const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { generateOrderNumber } = require("../utils/orderNumber");
const fs = require("fs");
const path = require("path");

/**
 * BANK TRANSFER PAYMENT SYSTEM
 * Handles payment proof uploads and admin verification
 */

// ============================================
// 1. BANK TRANSFER - UPLOAD PAYMENT PROOF
// ============================================
/**
 * @desc    Upload payment proof (screenshot + transaction ID)
 * @route   POST /api/payments/upload-proof
 * @access  Public (but tied to order)
 * @body    { orderId, transactionId, screenshot (file) }
 */
const uploadPaymentProof = async (req, res, next) => {
  try {
    const { orderId, transactionId } = req.body;

    console.log("📤 Payment proof upload request received");
    console.log("- Order ID:", orderId);
    console.log("- Transaction ID:", transactionId);
    console.log(
      "- File:",
      req.file ? `${req.file.filename} (${req.file.size} bytes)` : "NO FILE",
    );

    // Validate inputs
    if (!orderId) {
      res.status(400);
      throw new Error("Order ID is required");
    }

    if (!transactionId || transactionId.trim() === "") {
      res.status(400);
      throw new Error("Transaction ID is required");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("Payment screenshot is required");
    }

    // Validate file type (images only)
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      res.status(400);
      throw new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      res.status(400);
      throw new Error("File size must be less than 5MB");
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      fs.unlinkSync(req.file.path);
      res.status(404);
      throw new Error("Order not found");
    }

    // Verify it's a bank transfer order
    if (order.paymentMethod !== "bank") {
      fs.unlinkSync(req.file.path);
      res.status(400);
      throw new Error("This order does not use bank transfer payment");
    }

    // Check if order is in CREATED status (ready for payment)
    if (order.orderStatus !== "CREATED") {
      fs.unlinkSync(req.file.path);
      res.status(400);
      throw new Error(
        `Cannot upload payment proof for order in ${order.orderStatus} status`,
      );
    }

    // Store payment proof
    const relativeFilePath = `uploads/payment-proofs/${req.file.filename}`;
    order.transactionId = transactionId.trim();
    order.paymentProof = relativeFilePath;
    order.orderStatus = "PAYMENT_PENDING"; // Single source of truth
    order.paymentStatus = "PENDING"; // Payment-specific status
    order.verificationStatus = "PENDING"; // Waiting for admin verification

    await order.save();

    console.log(
      `✅ Payment proof uploaded for Order ${order.orderNumber}: Transaction ID: ${transactionId}`,
    );

    // Notify admins
    const io = req.app.get("io");
    if (io) {
      io.emit("paymentProofUploaded", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        message: `Payment proof uploaded for ${order.orderNumber}. Awaiting verification.`,
      });
    }

    res.json({
      success: true,
      message:
        "Payment proof uploaded successfully. Awaiting admin verification.",
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        transactionId: order.transactionId,
      },
    });
  } catch (error) {
    // Clean up file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ============================================
// 2. ADMIN - GET PENDING PAYMENTS
// ============================================
/**
 * @desc    Get all pending payment verifications
 * @route   GET /api/payments/pending
 * @access  Admin only
 */
const getPendingPayments = async (req, res, next) => {
  try {
    const orders = await Order.find({
      paymentMethod: "bank",
      verificationStatus: "PENDING",
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 3. ADMIN - APPROVE PAYMENT
// ============================================
/**
 * @desc    Admin approves payment proof
 * @route   POST /api/payments/approve
 * @access  Admin only
 * @body    { orderId }
 */
const approvePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Validate input
    if (!orderId) {
      res.status(400);
      throw new Error("Order ID is required");
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Validate order is pending verification
    if (order.verificationStatus !== "PENDING") {
      res.status(400);
      throw new Error(
        `Cannot approve order with status: ${order.verificationStatus}`,
      );
    }

    if (!order.paymentProof || !order.transactionId) {
      res.status(400);
      throw new Error("Payment proof or transaction ID missing");
    }

    // Update order - THIS IS THE ONLY PLACE WHERE PAYMENT APPROVAL HAPPENS
    order.verificationStatus = "APPROVED";
    order.orderStatus = "PAID"; // Single source of truth
    order.paymentStatus = "PAID"; // Payment-specific status
    order.verifiedBy = req.admin._id; // Admin who verified
    order.verifiedAt = new Date();
    order.paidAt = new Date();

    await order.save();

    console.log(
      `✅ APPROVED: Order ${order.orderNumber} - Payment verified by admin ${req.admin.email}`,
    );

    // Notify user and admins
    const io = req.app.get("io");
    if (io) {
      io.emit("paymentApproved", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        message: `Payment approved for ${order.orderNumber}. Order ready for processing.`,
      });
    }

    res.json({
      success: true,
      message: "Payment approved successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 4. ADMIN - REJECT PAYMENT
// ============================================
/**
 * @desc    Admin rejects payment proof
 * @route   POST /api/payments/reject
 * @access  Admin only
 * @body    { orderId, reason }
 */
const rejectPayment = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    // Validate input
    if (!orderId) {
      res.status(400);
      throw new Error("Order ID is required");
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Validate order is pending verification
    if (order.verificationStatus !== "PENDING") {
      res.status(400);
      throw new Error(
        `Cannot reject order with status: ${order.verificationStatus}`,
      );
    }

    // Update order
    order.verificationStatus = "REJECTED";
    order.rejectionReason = reason || "No reason provided";
    order.verifiedBy = req.admin._id; // Admin who rejected
    order.verifiedAt = new Date();

    // Keep order status as PAYMENT_PENDING (user can re-upload)
    order.orderStatus = "PAYMENT_PENDING";
    order.paymentStatus = "PENDING"; // Reset payment status for re-upload

    await order.save();

    console.log(
      `❌ REJECTED: Order ${order.orderNumber} - Reason: ${order.rejectionReason}`,
    );

    // Notify user and admins
    const io = req.app.get("io");
    if (io) {
      io.emit("paymentRejected", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        reason: order.rejectionReason,
        message: `Payment rejected for ${order.orderNumber}. Please upload again.`,
      });
    }

    res.json({
      success: true,
      message: "Payment rejected",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 5. GET PAYMENT STATUS
// ============================================
/**
 * @desc    Get payment status for an order
 * @route   GET /api/payments/status/:orderId
 * @access  Public
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // For bank transfer orders, return verification status
    if (order.paymentMethod === "bank") {
      return res.json({
        paymentMethod: "bank",
        orderStatus: order.orderStatus,
        transactionId: order.transactionId || null,
        verificationStatus: order.verificationStatus || null,
        rejectionReason: order.rejectionReason || null,
        verifiedAt: order.verifiedAt || null,
      });
    }

    // For COD, just return order status
    res.json({
      paymentMethod: "cod",
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 6. GET BANK ACCOUNT DETAILS
// ============================================
/**
 * @desc    Get bank account details for payment
 * @route   GET /api/payments/bank-details
 * @access  Public
 */
const getBankDetails = (req, res) => {
  res.json({
    bankName: process.env.BANK_NAME || "AAZ International Bank",
    accountHolder: process.env.ACCOUNT_HOLDER || "AAZ Medical Equipment",
    accountNumber: process.env.ACCOUNT_NUMBER || "XXXXXXXXXX",
    bankCode: process.env.BANK_CODE || "XXXX",
    iban: process.env.IBAN || "PKXX XXXX XXXX XXXX XXXX XXXX",
    instructions:
      "Please transfer the exact amount and provide the transaction ID when uploading payment proof.",
  });
};

module.exports = {
  uploadPaymentProof,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getPaymentStatus,
  getBankDetails,
};
