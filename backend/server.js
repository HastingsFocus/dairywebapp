import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";

dotenv.config();


connectDB();

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "🥛 Dairy Records API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Dairy Records API running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});