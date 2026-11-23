
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
//import emailAuthRoutes from "./routes/emailAuthRoutes.js";

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://dairymanagementsys.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Handle preflight requests
app.options(
  /.*/,
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "🥛 Dairy Records API is running...",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/users", userRoutes);
app.use("/api/milk-records", milkRecordRoutes);
app.use("/api/milk-prices", milkPriceRoutes);
app.use("/api/financial-reports", financialReportRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/settlements", settlementRoutes);

// Temporary Gmail OAuth setup routes
//app.use(emailAuthRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Dairy Records API running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
