const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");
const { generateOrderNumber } = require("../utils/orderNumber");

// @desc    Create new order (Guest)
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      email,
      phone,
      address,
      city,
      products: cartItems,
      paymentMethod,
    } = req.body;

    // EMAIL VERIFICATION IS NOW OPTIONAL - Users can place orders without verifying
    // Verification is still encouraged for account security and order notifications
    // if (req.user && !req.user.isVerified) {
    //   res.status(403);
    //   throw new Error('Please verify your email address before placing an order. Go to My Profile to resend the verification email.');
    // }

    if (!cartItems || cartItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
    }

    // 1. RE-VALIDATE CART (Price, Stock, isActive) - SERVER SIDE TRUTH
    let totalAmount = 0;
    const validatedProducts = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product);

      // Stock & Activity Check
      if (!product || !product.isActive) {
        res.status(400);
        throw new Error(`Product ${item.product} is no longer available.`);
      }

      if (product.stock < item.quantity) {
        res.status(400);
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        );
      }

      // PRICE RE-CHECK (Ignore price sent from frontend to prevent manipulation)
      const currentPrice = product.price;
      const subtotal = currentPrice * item.quantity;
      totalAmount += subtotal;

      validatedProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: currentPrice,
      });
    }

    // 2. GENERATE SEQUENTIAL ORDER NUMBER
    const orderNumber = await generateOrderNumber();

    // 3. CREATE ORDER IN 'CREATED' STATE
    const order = new Order({
      user: req.user ? req.user._id : undefined,
      orderNumber,
      customerName,
      email,
      phone,
      address,
      city,
      products: validatedProducts,
      paymentMethod, // "bank" or "cod"
      totalAmount,
      orderStatus: "CREATED", // Initial status
      // For bank transfer: will be set to PAYMENT_PENDING after proof upload
      // For COD: can proceed to SHIPPED
    });

    const createdOrder = await order.save();

    // 4. REAL-TIME NOTIFICATION
    const io = req.app.get("io");
    if (io) {
      io.emit("newOrder", {
        orderId: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        customerName: createdOrder.customerName,
        totalAmount: createdOrder.totalAmount,
        paymentMethod: createdOrder.paymentMethod,
        message: `New order ${createdOrder.orderNumber} from ${createdOrder.customerName}`,
      });
      io.emit("analyticsUpdate");
    }

    console.log(
      `📣 NOTIFICATION: New Order Created: ${createdOrder.orderNumber} (${createdOrder._id}). Payment Method: ${createdOrder.paymentMethod}. Status: CREATED`,
    );

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate("products.product", "name price")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "products.product",
      "name image",
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status: nextStatus } = req.body;
    const orderId = req.params.id;

    console.log("🛠️ Status Update Request:");
    console.log("- Order ID:", orderId);
    console.log("- New Status:", nextStatus);
    console.log("- Is Admin:", !!req.admin);
    console.log("- Is User:", !!req.user);

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    const currentStatus = order.orderStatus;
    console.log(
      `🛠️ ADMIN ACTION: Updating Order ${orderId} from ${currentStatus} to ${nextStatus}`,
    );

    // 1. STATE MACHINE VALIDATION (Prevent Skipping Steps)
    // Updated to support new professional status names
    const validTransitions = {
      // New professional statuses
      PENDING: ["PROCESSING", "CANCELLED"],
      PROCESSING: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      CANCELLED: [],

      // Legacy status support (backward compatibility)
      CREATED: [
        "PAYMENT_PENDING",
        "PAID",
        "CONFIRMED",
        "PROCESSING",
        "CANCELLED",
      ],
      PAYMENT_PENDING: ["PAID", "PROCESSING", "CANCELLED"],
      PAID: ["CONFIRMED", "PROCESSING", "SHIPPED", "CANCELLED"],
      CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
      COMPLETED: [],
    };

    if (
      currentStatus !== nextStatus &&
      !validTransitions[currentStatus]?.includes(nextStatus)
    ) {
      res.status(400);
      throw new Error(
        `Invalid transition: Cannot move order from ${currentStatus} to ${nextStatus}`,
      );
    }

    // 2. SPECIAL HANDLING: Stock Reduction / Restoration
    // A. Reduce stock when order moves to a "Confirmed" state if not already reduced
    const confirmedStatuses = ["PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CONFIRMED", "PAID"];
    const shouldReduceStock = confirmedStatuses.includes(nextStatus) && !order.stockReduced;

    if (shouldReduceStock) {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(
              `Insufficient stock for ${product.name}. Cannot proceed with order.`,
            );
          }
          product.stock -= item.quantity;
          await product.save();
        }
      }
      order.stockReduced = true;
      console.log(
        `📦 STOCK DEDUCTED: Order ${orderId} moved to ${nextStatus}.`,
      );
    }

    // B. Restore stock if order is CANCELLED and was previously reduced
    if (nextStatus === "CANCELLED" && order.stockReduced) {
      for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
      order.stockReduced = false;
      console.log(
        `📦 STOCK RESTORED: Order ${orderId} was cancelled.`,
      );
    }

    // 3. APPLY UPDATE
    order.orderStatus = nextStatus;

    // Mark as delivered for both new and legacy statuses
    if (nextStatus === "DELIVERED" || nextStatus === "COMPLETED") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // 4. NOTIFICATION TRIGGER
    console.log(
      `📣 NOTIFICATION: Order ${orderId} status changed to ${nextStatus}.`,
    );

    // 5. REAL-TIME UPDATE (Socket.io)
    const io = req.app.get("io");
    if (io) {
      io.emit("orderStatusUpdate", {
        orderId: updatedOrder._id,
        status: updatedOrder.orderStatus,
        isDelivered: updatedOrder.isDelivered,
        deliveredAt: updatedOrder.deliveredAt,
      });
      // Also refresh analytics if status change affects revenue
      io.emit("analyticsUpdate");
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Update Order Error:", error);
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/orders/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Basic Counts
    const totalOrders = await Order.countDocuments({
      orderStatus: { $nin: ["CANCELLED", "pending", "Pending"] }, // Exclude cancelled and old-format pendings if needed
    });

    // Count ALL orders for general stats, exclude only explicitly cancelled
    const realTotalOrders = await Order.countDocuments({
      orderStatus: { $ne: "CANCELLED" },
    });
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Customers = Anyone who is not an admin
    const totalCustomers = await User.countDocuments({
      isAdmin: { $ne: true },
    });

    console.log("📊 DASHBOARD SCRAPER:");
    console.log(`- Orders: ${realTotalOrders}`);
    console.log(`- Products: ${totalProducts}`);
    console.log(`- Categories: ${totalCategories}`);
    console.log(`- Customers: ${totalCustomers}`);

    // 2. Revenue Calculation
    // Count ALL non-cancelled orders to show Gross Merchandise Value (GMV)
    // This aligns with the analytics chart and ensures pending/COD orders are visible
    const revenueStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: "CANCELLED" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          count: { $sum: 1 } // Add count to see if documents are matching
        },
      },
    ]);

    console.log("🐛 DEBUG REVENUE CALCULATION:");
    console.log("- Match Criteria: { orderStatus: { $ne: 'CANCELLED' } }");
    console.log("- Aggregation Result:", JSON.stringify(revenueStats, null, 2));

    const totalSales =
      revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    console.log(`- Final Total Sales: ${totalSales}`);
    console.log(`- Total Revenue: Rs. ${totalSales}`);

    // 3. Analytics (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $nin: ["CANCELLED"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayData = dailySales.find((item) => item._id === dateStr);

      last7Days.push({
        date: dateStr,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        amount: dayData ? dayData.amount : 0,
        count: dayData ? dayData.count : 0,
      });
    }

    res.json({
      totalOrders: realTotalOrders,
      totalProducts,
      totalCategories,
      totalCustomers,
      totalSales,
      analytics: last7Days,
    });
  } catch (error) {
    console.error("❌ Stats Error:", error);
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
};
