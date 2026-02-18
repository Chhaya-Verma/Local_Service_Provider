import { Router } from "express";
import {
  createService,
  getServices,
  getServiceById,
  getServicesByProvider,
  updateService,
  deleteService,
  getServiceCategories,
} from "../controllers/serviceController";
import { authenticate, authorizeServiceProvider } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", getServices);
router.get("/categories", getServiceCategories);
router.get("/:id", getServiceById);

// Protected routes for service providers
router.post("/", authenticate, authorizeServiceProvider, createService);
router.get("/provider/my-services", authenticate, authorizeServiceProvider, getServicesByProvider);
router.put("/:id", authenticate, authorizeServiceProvider, updateService);
router.delete("/:id", authenticate, authorizeServiceProvider, deleteService);

export default router;
