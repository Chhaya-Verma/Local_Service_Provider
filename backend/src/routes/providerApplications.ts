import { Router } from "express";
import {
  submitApplication,
  getMyApplication,
  updateApplication,
  getAllApplications,
  reviewApplication,
  uploadDocument
} from "../controllers/providerApplicationController";
import { authenticate } from "../middleware/auth";

const router = Router();

// Provider application routes (authenticated)
router.post("/", authenticate, submitApplication);
router.get("/my-application", authenticate, getMyApplication);
router.put("/my-application", authenticate, updateApplication);
router.post("/upload/:documentType", authenticate, uploadDocument);

// Admin routes (authenticated + admin check in controller)
router.get("/admin/all", authenticate, getAllApplications);
router.put("/admin/:applicationId/review", authenticate, reviewApplication);

export default router;
