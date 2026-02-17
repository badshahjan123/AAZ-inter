const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["bank", "cod"], // ONLY: Bank Transfer & Cash on Delivery
      default: "cod",
    },
    // ============================================
    // ORDER STATUS (Primary workflow status)
    // ============================================
    orderStatus: {
      type: String,
      required: true,
      enum: [
        "pending",      // Initial state - awaiting payment verification
        "processing",   // Being prepared for shipment
        "shipped",      // Out for delivery
        "delivered",    // Successfully delivered
        "cancelled",    // Cancelled by admin or customer
        // Legacy statuses (backward compatibility)
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "CREATED",
        "PAYMENT_PENDING",
        "PAID",
        "CONFIRMED",
        "COMPLETED",
      ],
      default: "pending",
    },

    // ============================================
    // PAYMENT STATUS (Separate payment tracking)
    // ============================================
    paymentStatus: {
      type: String,
      enum: [
        "pending",      // Awaiting payment verification
        "approved",     // Payment verified and approved
        "rejected",     // Payment rejected
        "paid",         // Legacy: payment completed
        "failed",       // Payment failed
        "refunded",     // Payment refunded
        // Legacy uppercase versions
        "PENDING",
        "APPROVED",
        "REJECTED", 
        "PAID",
        "FAILED",
        "REFUNDED"
      ],
      default: "pending",
    },

    // ============================================
    // BANK TRANSFER PAYMENT FIELDS
    // ============================================
    transactionId: {
      type: String,
      default: null, // User-provided transaction ID
    },
    paymentProof: {
      type: String, // Path to uploaded payment screenshot
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", null],
      default: null, // Only for bank transfer orders
    },
    rejectionReason: {
      type: String,
      default: null, // Reason if admin rejects payment
    },
    verifiedAt: {
      type: Date,
      default: null, // When admin verified payment
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Admin who verified the payment
    },
    paidAt: {
      type: Date,
      default: null, // When payment was confirmed (for bank) or auto-confirmed (for COD)
    },

    // ============================================
    // DELIVERY TRACKING
    // ============================================
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },

    // WhatsApp Confirmation
    whatsappConfirmed: {
      type: Boolean,
      default: false,
    },
    whatsappConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
