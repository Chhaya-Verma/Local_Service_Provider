import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Service from "../models/Service";
import Booking from "../models/Booking";

// Get dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.userType !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const totalUsers = await User.countDocuments();
    const totalServiceProviders = await User.countDocuments({ userType: "service_provider" });
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalServiceProviders,
          totalServices,
          totalBookings,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.userType !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all service providers
export const getAllServiceProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.userType !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const providers = await User.find({ userType: "service_provider" }).select("-password");

    res.status(200).json({
      success: true,
      data: {
        providers,
        total: providers.length,
      },
    });
  } catch (error) {
    console.error("Get all service providers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all services
export const getAllServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.userType !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const services = await Service.find().populate("providerId", "name email businessName");

    res.status(200).json({
      success: true,
      data: {
        services,
        total: services.length,
      },
    });
  } catch (error) {
    console.error("Get all services error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all bookings
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.userType !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const bookings = await Booking.find()
      .populate("userId", "name email phone")
      .populate("serviceId", "title price")
      .populate("providerId", "name businessName");

    res.status(200).json({
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
