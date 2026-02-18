import { Request, Response } from "express";
import Booking from "../models/Booking";
import Service from "../models/Service";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Create a new booking (Customers only)
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "customer") {
      res.status(403).json({
        success: false,
        message: "Only customers can create bookings",
      });
      return;
    }

    const {
      serviceId,
      bookingDate,
      timeSlot,
      address,
      notes,
      paymentMethod,
    } = req.body;

    // Validate address is provided
    if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
      res.status(400).json({
        success: false,
        message: "Complete address is required (street, city, state, zipCode)",
      });
      return;
    }

    // Fetch service details
    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    // Fetch service provider details
    const serviceProvider = await User.findById(service.serviceProviderId);
    if (!serviceProvider) {
      res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
      return;
    }

    // Check if service is active
    if (!service.isActive) {
      res.status(400).json({
        success: false,
        message: "Service is not currently available",
      });
      return;
    }

    // Validate booking date (should be in the future)
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past",
      });
      return;
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      serviceProviderId: service.serviceProviderId,
      bookingDate: selectedDate,
      "timeSlot.start": { $lt: timeSlot.end },
      "timeSlot.end": { $gt: timeSlot.start },
      status: { $in: ["pending", "confirmed", "in_progress"] },
    });

    if (conflictingBooking) {
      res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
      return;
    }

    // Calculate total amount
    let totalAmount = service.price.amount;
    if (service.price.type === "hourly") {
      const startTime = timeSlot.start.split(':');
      const endTime = timeSlot.end.split(':');
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      const durationHours = Math.max(1, (endMinutes - startMinutes) / 60);
      totalAmount = service.price.amount * durationHours;
    }

    // Create booking
    const booking = new Booking({
      customerId: user._id,
      serviceProviderId: service.serviceProviderId,
      serviceId: service._id,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      serviceProvider: {
        name: serviceProvider.name,
        businessName: serviceProvider.businessName || serviceProvider.name,
        phone: serviceProvider.phone,
        email: serviceProvider.email,
      },
      service: {
        title: service.title,
        category: service.category,
        price: service.price,
      },
      bookingDate: selectedDate,
      timeSlot,
      address,
      notes,
      totalAmount,
      paymentMethod: paymentMethod || "cash",
    });

    await booking.save();

    // Update service booking count
    service.totalBookings += 1;
    await service.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while creating booking",
    });
  }
};

// Get customer's bookings
export const getCustomerBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { 
      status, 
      page = 1, 
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // If user is a service provider, get their service bookings
    let query: any;
    if (user.userType === "service_provider") {
      query = { serviceProviderId: user._id };
    } else {
      // If customer, get their bookings
      query = { customerId: user._id };
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(query)
      .populate('serviceId', 'title description category price location rating totalReviews images')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'serviceProviderId',
          select: 'businessName avatar rating totalReviews'
        }
      })
      .populate('customerId', 'name email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  } catch (error: any) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching bookings",
    });
  }
};

// Get booking by ID
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate('serviceId', 'title description category price location rating totalReviews images')
      .populate({
        path: 'serviceId',
        populate: {
          path: 'serviceProviderId',
          select: 'businessName avatar rating totalReviews'
        }
      })
      .populate('customerId', 'name email phone')
      .lean();

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check if user has access to this booking
    const hasAccess = (booking.customerId as any)._id?.toString() === user._id.toString() ||
                     booking.serviceProviderId.toString() === user._id.toString();

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error: any) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching booking",
    });
  }
};

// Cancel booking (Customer only)
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "customer") {
      res.status(403).json({
        success: false,
        message: "Only customers can cancel bookings",
      });
      return;
    }

    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check if user owns this booking
    if (booking.customerId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
      return;
    }

    // Check if booking can be cancelled
    if (!["pending", "confirmed"].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled in its current status",
      });
      return;
    }

    // Check cancellation policy (24 hours before booking)
    const bookingDateTime = new Date(booking.bookingDate);
    const [hours, minutes] = booking.timeSlot.start.split(':');
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      res.status(400).json({
        success: false,
        message: "Booking can only be cancelled at least 24 hours in advance",
      });
      return;
    }

    // Update booking status
    booking.status = "cancelled";
    booking.cancelledBy = "customer";
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while cancelling booking",
    });
  }
};

// Reschedule booking (Customer only)
export const rescheduleBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "customer") {
      res.status(403).json({
        success: false,
        message: "Only customers can reschedule bookings",
      });
      return;
    }

    const { bookingId } = req.params;
    const { newBookingDate, newTimeSlot } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check if user owns this booking
    if (booking.customerId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
      return;
    }

    // Check if booking can be rescheduled
    if (!["pending", "confirmed"].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: "Booking cannot be rescheduled in its current status",
      });
      return;
    }

    // Validate new booking date
    const newDate = new Date(newBookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newDate < today) {
      res.status(400).json({
        success: false,
        message: "New booking date cannot be in the past",
      });
      return;
    }

    // Check for conflicting bookings on new date/time
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id }, // Exclude current booking
      serviceProviderId: booking.serviceProviderId,
      bookingDate: newDate,
      "timeSlot.start": { $lt: newTimeSlot.end },
      "timeSlot.end": { $gt: newTimeSlot.start },
      status: { $in: ["pending", "confirmed", "in_progress"] },
    });

    if (conflictingBooking) {
      res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
      return;
    }

    // Update booking
    booking.bookingDate = newDate;
    booking.timeSlot = newTimeSlot;
    booking.status = "pending"; // Reset to pending for provider confirmation
    
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully",
      data: { booking },
    });
  } catch (error: any) {
    console.error("Reschedule booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while rescheduling booking",
    });
  }
};

// Rate and review service (Customer only)
export const rateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "customer") {
      res.status(403).json({
        success: false,
        message: "Only customers can rate services",
      });
      return;
    }

    const { bookingId } = req.params;
    const { rating, review } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check if user owns this booking
    if (booking.customerId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
      return;
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      res.status(400).json({
        success: false,
        message: "Can only rate completed services",
      });
      return;
    }

    // Check if already rated
    if (booking.rating) {
      res.status(400).json({
        success: false,
        message: "Booking has already been rated",
      });
      return;
    }

    // Update booking with rating and review
    booking.rating = rating;
    booking.review = review;
    booking.reviewDate = new Date();
    
    await booking.save();

    // Update service and provider ratings
    const service = await Service.findById(booking.serviceId);
    const serviceProvider = await User.findById(booking.serviceProviderId);

    if (service) {
      const allBookings = await Booking.find({
        serviceId: booking.serviceId,
        rating: { $exists: true },
      });
      
      const avgRating = allBookings.reduce((sum, b) => sum + b.rating!, 0) / allBookings.length;
      service.rating = parseFloat(avgRating.toFixed(1));
      service.totalReviews = allBookings.length;
      await service.save();
    }

    if (serviceProvider) {
      const allProviderBookings = await Booking.find({
        serviceProviderId: booking.serviceProviderId,
        rating: { $exists: true },
      });
      
      const avgRating = allProviderBookings.reduce((sum, b) => sum + b.rating!, 0) / allProviderBookings.length;
      serviceProvider.rating = parseFloat(avgRating.toFixed(1));
      serviceProvider.totalReviews = allProviderBookings.length;
      await serviceProvider.save();
    }

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      data: { booking },
    });
  } catch (error: any) {
    console.error("Rate service error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while rating service",
    });
  }
};

// Update booking status (Service Provider only)
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can update booking status",
      });
      return;
    }

    const { bookingId } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status",
      });
      return;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check if user is the service provider for this booking
    if (booking.serviceProviderId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this booking",
      });
      return;
    }

    // Validate status transitions
    const validTransitions: { [key: string]: string[] } = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from ${booking.status} to ${status}`,
      });
      return;
    }

    booking.status = status;
    if (status === "completed") {
      booking.completedAt = new Date();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: { booking },
    });
  } catch (error: any) {
    console.error("Update booking status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating booking status",
    });
  }
};
