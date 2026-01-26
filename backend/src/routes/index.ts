import { Router } from "express";
import authRoutes from "./auth";
import serviceRoutes from "./services";

const router = Router();

// Mount auth routes
router.use("/auth", authRoutes);

// Mount service routes
router.use("/services", serviceRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
