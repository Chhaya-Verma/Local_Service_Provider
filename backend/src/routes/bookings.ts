import express from "express";
import {
  createBooking,
  getCustomerBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  rateService,
} from "../controllers/bookingController";
import { authenticate, authorizeCustomer } from "../middleware/auth";

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// Create booking (customers only)
router.post("/", authorizeCustomer, createBooking);

// Get customer's bookings
router.get("/", getCustomerBookings);

// Get booking by ID
router.get("/:bookingId", getBookingById);

// Cancel booking (customers only)
router.patch("/:bookingId/cancel", authorizeCustomer, cancelBooking);

// Reschedule booking (customers only)
router.patch("/:bookingId/reschedule", authorizeCustomer, rescheduleBooking);

// Rate and review service (customers only)
router.patch("/:bookingId/rate", authorizeCustomer, rateService);

export default router;
