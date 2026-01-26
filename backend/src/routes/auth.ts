import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyAccount,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
} from "../middleware/validation";

const router = Router();

// Public routes
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/verify-account", verifyAccount);

// Protected routes (require authentication)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, validatePasswordChange, changePassword);
router.post("/logout", authenticate, logout);

export default router;
