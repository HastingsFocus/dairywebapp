import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please log in." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Authentication token is missing." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin" && decoded.id === "admin") {
      req.user = {
        _id: "admin",
        id: "admin",
        email: process.env.ADMIN_EMAIL,
        role: "admin",
        isActive: true,
      };
      return next();
    }

    if (!["owner", "buyer", "farmer"].includes(decoded.role)) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User account not found." });

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
    }

    if (user.role !== decoded.role) {
      return res.status(401).json({ message: "Your authentication token is no longer valid." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid authentication token." });
    }
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ message: "Authentication failed due to a server error." });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Please authenticate first." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
};