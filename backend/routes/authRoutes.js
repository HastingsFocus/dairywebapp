import express from "express";
import { loginAdmin, registerOwner, loginUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/admin/login", loginAdmin);
router.post("/register-owner", registerOwner);
router.post("/login", loginUser);

export default router;