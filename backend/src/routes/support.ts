import express from "express";
import {
  createSupportTicket,
  getUserSupportTickets,
  getSupportTicketById,
  addMessageToTicket,
  closeSupportTicket,
} from "../controllers/supportController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All support routes require authentication
router.use(authenticate);

// Create support ticket
router.post("/", createSupportTicket);

// Get user's support tickets
router.get("/", getUserSupportTickets);

// Get support ticket by ID
router.get("/:ticketId", getSupportTicketById);

// Add message to support ticket
router.post("/:ticketId/messages", addMessageToTicket);

// Close support ticket
router.patch("/:ticketId/close", closeSupportTicket);

export default router;
