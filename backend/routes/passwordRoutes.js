import express from "express";
import { forgotPassword, resetPassword, setInitialPassword } from "../controllers/passwordController.js";

const router = express.Router();

router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);
router.post("/setup/:token", setInitialPassword);

export default router;