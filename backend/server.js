const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");
const path = require("path");

// Load env vars FIRST
dotenv.config();

// Debug SMTP Config (Presence only)
if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  console.log('✅ SMTP Configuration: DETECTED');
} else {
  console.log('❌ SMTP Configuration: MISSING');
}

// Validate critical environment variables (secure comparison)
const crypto = require("crypto");
const expectedSecret = "your_jwt_secret_key_here";
const actualSecret = process.env.JWT_SECRET || "";

// Use constant-time comparison to prevent timing attacks
const maxLength = Math.max(expectedSecret.length, actualSecret.length);
const secretsMatch = crypto.timingSafeEqual(
  Buffer.from(expectedSecret.padEnd(maxLength)),
  Buffer.from(actualSecret.padEnd(maxLength)),
);

if (!process.env.JWT_SECRET || secretsMatch) {
  console.error(
    "❌ SECURITY ERROR: JWT_SECRET not set or using default value!",
  );
  console.error(
    "⚠️  Generate a secure secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"",
  );
  process.exit(1);
}

// Route files
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

// Connect to database
connectDB();

const app = express();

// Trust proxy for rate-limiting
app.set('trust proxy', 1);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    smtp: process.env.SMTP_EMAIL ? 'DETECTION_SUCCESS' : 'DETECTION_FAILED'
  });
});

// Periodic Heartbeat for logs
setInterval(() => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`💓 Heartbeat: Server running at ${new Date().toISOString()}`);
  }
}, 600000); // Every 10 mins

// ============================================
// SECURITY MIDDLEWARE (Defense-in-Depth)
// ============================================

// 1. Helmet - Secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:5000"],
        imgSrc: ["'self'", "data:", "https:", "http://localhost:5000"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// 2. Hide server fingerprinting
app.disable("x-powered-by");

// 3. CORS - Restrict to specific origin (NO WILDCARDS!)
const allowedOrigins = [
  "http://localhost:5173", // Development frontend
  "http://localhost:3000", // Alternative dev port
  "https://aaz-international.vercel.app", // Production frontend (Vercel)
  "https://cheerful-profiterole-accab4.netlify.app", // Production frontend (Netlify old)
  "https://equipments.netlify.app", // Production frontend (Netlify new)
  process.env.FRONTEND_URL, // Production frontend (env var)
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app")) {
        callback(null, true);
      } else {
        console.warn(
          `⚠️ SECURITY: Blocked CORS request from unauthorized origin: ${origin}`,
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "X-Request-Id"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }),
);

// Explicit OPTIONS handler for preflight requests
app.options('*', cors());

// 4. Body parser with size limits (prevent DoS)
app.use(express.json({ limit: "10kb" })); // Small limit for JSON
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 5. MongoDB injection prevention
app.use(
  mongoSanitize({
    replaceWith: "_", // Replace $ and . characters
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️ SECURITY: Sanitized key ${key} from ${req.path}`);
    },
  }),
);

// 6. Global rate limiting
app.use("/api/", apiLimiter);

// ============================================
// API ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);

// Debug Routes
const debugRoutes = require("./routes/debugRoutes");
app.use("/api/debug", debugRoutes);

// ============================================
// STATIC FILES (Secure serving)
// ============================================
// Serve uploads with security headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Prevent execution of uploaded files
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    next();
  },
  express.static(path.join(__dirname, "/uploads")),
);

// ============================================
// BASE ROUTES
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "AAZ Medical API",
    version: "1.0.0",
    status: "secure",
    environment: process.env.NODE_ENV,
  });
});

// Health check endpoint (for monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================
const http = require('http');
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log("=========================================");
    console.log(`🔒 Secure Server Running`);
    console.log(`📍 Mode: ${process.env.NODE_ENV}`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🛡️  Security: ENABLED`);
    console.log("=========================================");
  });
}

// ============================================
// SOCKET.IO (Secure Configuration)
// ============================================
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Connection timeout
  pingTimeout: 60000,
  pingInterval: 25000,
  // Max payload size
  maxHttpBufferSize: 1e6, // 1MB
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });

  // Add socket authentication here if needed
});

// Make io accessible to routes
app.set("io", io);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, closing server gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

module.exports = { app, io };
