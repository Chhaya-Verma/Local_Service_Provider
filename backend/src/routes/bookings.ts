import express from "express";
import {
  createBooking,
  getCustomerBookings,
  getServiceProviderBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  rateService,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  getEarningsSummary,
} from "../controllers/bookingController";
import { authenticate, authorizeCustomer, authorizeServiceProvider } from "../middleware/auth";

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// Create booking (customers only)
router.post("/", authorizeCustomer, createBooking);

// Get customer's bookings
router.get("/customer", getCustomerBookings);

// Get service provider's bookings
router.get("/provider", authorizeServiceProvider, getServiceProviderBookings);

// Get booking by ID
router.get("/:bookingId", getBookingById);

// Cancel booking (customers only)
router.patch("/:bookingId/cancel", authorizeCustomer, cancelBooking);

// Reschedule booking (customers only)
router.patch("/:bookingId/reschedule", authorizeCustomer, rescheduleBooking);

// Accept booking (service providers only)
router.patch("/:bookingId/accept", authorizeServiceProvider, acceptBooking);

// Reject booking (service providers only)
router.patch("/:bookingId/reject", authorizeServiceProvider, rejectBooking);

// Update booking status (service providers only)
router.patch("/:bookingId/status", authorizeServiceProvider, updateBookingStatus);

// Rate and review service (customers only)
router.patch("/:bookingId/rate", authorizeCustomer, rateService);

// Get earnings summary (service providers only)
router.get("/provider/earnings", authorizeServiceProvider, getEarningsSummary);

// Rate and review service (customers only)
router.patch("/:bookingId/rate", authorizeCustomer, rateService);

export default router;
