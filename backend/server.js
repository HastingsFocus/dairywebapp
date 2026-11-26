
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import milkRecordRoutes from "./routes/milkRecordRoutes.js";
import milkPriceRoutes from "./routes/milkPriceRoutes.js";
import financialReportRoutes from "./routes/financialReportRoutes.js";
import loanRoutes from "./routes/loanRoutes.js";
import settlementRoutes from "./routes/settlementRoutes.js";
import ussdRoutes from "./routes/ussdRoutes.js";

dotenv.config();

const app = express();

// ========================================
// DATABASE CONNECTION
// ========================================

connectDB();

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",

  // Previous Netlify domain
  "https://dairymanagementsys.netlify.app",

  // Current Netlify domain
  "https://effulgent-faun-94024b.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin headers
    // such as server-to-server requests.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(`CORS blocked origin: ${origin}`);

    return callback(
      new Error(`CORS blocked for origin: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  optionsSuccessStatus: 204,
};

// Register CORS before routes.
// This middleware also handles preflight OPTIONS requests.
app.use(cors(corsOptions));

// ========================================
// BODY PARSING
// ========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: false,
  })
);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🥛 Dairy Records API is running...",
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/milk-records", milkRecordRoutes);
app.use("/api/milk-prices", milkPriceRoutes);
app.use("/api/financial-reports", financialReportRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/ussd", ussdRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  // CORS errors and other errors
  // are handled here.
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Dairy Records API running on port ${PORT}`
  );

  console.log(
    `📡 API: http://localhost:${PORT}/api`
  );
});
