import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getDashboardStats,
  getAllUsers,
  getAllServiceProviders,
  getAllServices,
  getAllBookings,
} from "../controllers/adminController";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Dashboard stats
router.get("/stats", getDashboardStats);

// Users management
router.get("/users", getAllUsers);

// Service providers management
router.get("/service-providers", getAllServiceProviders);

// Services management
router.get("/services", getAllServices);

// Bookings management
router.get("/bookings", getAllBookings);

export default router;
