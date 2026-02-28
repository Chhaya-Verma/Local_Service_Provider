import { Router } from "express";
import authRoutes from "./auth";
import serviceRoutes from "./services";
import bookingRoutes from "./bookings";
import supportRoutes from "./support";
import addressRoutes from "./addresses";
import adminRoutes from "./admin";

const router = Router();

// Mount auth routes
router.use("/auth", authRoutes);

// Mount service routes
router.use("/services", serviceRoutes);

// Mount booking routes
router.use("/bookings", bookingRoutes);

// Mount support routes
router.use("/support", supportRoutes);

// Mount address routes
router.use("/addresses", addressRoutes);

// Mount admin routes
router.use("/admin", adminRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
