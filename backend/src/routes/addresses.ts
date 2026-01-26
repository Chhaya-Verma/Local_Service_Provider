import express from "express";
import {
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
} from "../controllers/addressController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All address routes require authentication
router.use(authenticate);

// Get saved addresses
router.get("/", getSavedAddresses);

// Add saved address
router.post("/", addSavedAddress);

// Update saved address
router.put("/:addressId", updateSavedAddress);

// Delete saved address
router.delete("/:addressId", deleteSavedAddress);

export default router;
