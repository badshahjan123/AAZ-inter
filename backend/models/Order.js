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
    orderStatus: {
      type: String,
      required: true,
      enum: [
        // New professional statuses
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        // Legacy statuses (backward compatibility)
        "CREATED",
        "PAYMENT_PENDING",
        "PAID",
        "CONFIRMED",
        "COMPLETED",
      ],
      default: "CREATED",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
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
