import { Router } from "express";
import {
  createService,
  getServices,
  getServiceById,
  getServicesByProvider,
  updateService,
  deleteService,
  getServiceCategories,
  getMyServices,
  updateMyService,
  toggleServiceStatus,
  deleteMyService,
  updateProviderAvailability,
} from "../controllers/serviceController";
import { authenticate, authorizeServiceProvider } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getServices);
router.get("/categories", getServiceCategories);
router.get("/:id", getServiceById);

// Protected routes for service providers
router.post("/", authenticate, authorizeServiceProvider, createService);

// Provider service management routes
router.get("/my-services", authenticate, authorizeServiceProvider, getMyServices);
router.put("/my-services/:id", authenticate, authorizeServiceProvider, updateMyService);
router.patch("/my-services/:id/toggle-status", authenticate, authorizeServiceProvider, toggleServiceStatus);
router.delete("/my-services/:id", authenticate, authorizeServiceProvider, deleteMyService);
router.put("/my-availability", authenticate, authorizeServiceProvider, updateProviderAvailability);

// Legacy routes (keeping for backward compatibility)
router.get("/provider/my-services", authenticate, authorizeServiceProvider, getServicesByProvider);
router.put("/:id", authenticate, authorizeServiceProvider, updateService);
router.delete("/:id", authenticate, authorizeServiceProvider, deleteService);

export default router;
