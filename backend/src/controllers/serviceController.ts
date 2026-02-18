import { Request, Response } from "express";
import Service from "../models/Service";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Create a new service (Service Providers only)
export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can create services",
      });
      return;
    }

    const {
      title,
      description,
      category,
      price,
      location,
      availability,
      images,
      tags,
      duration,
      requirements,
    } = req.body;

    // Create service with provider info
    const service = new Service({
      title,
      description,
      category,
      price,
      serviceProviderId: user._id,
      serviceProvider: {
        name: user.name,
        businessName: user.businessName || user.name,
        rating: user.rating || 0,
        totalReviews: user.totalReviews || 0,
        avatar: user.avatar,
      },
      location: location || {
        city: user.address?.city || "",
        state: user.address?.state || "",
        coordinates: user.address?.coordinates,
      },
      availability: availability || user.availability || {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeSlots: [{ start: "09:00", end: "17:00" }],
      },
      images: images || [],
      tags: tags || [],
      duration,
      requirements: requirements || [],
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  } catch (error: any) {
    console.error("Create service error:", error);
    
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
      message: "Internal server error while creating service",
    });
  }
};

// Get all services (with filtering)
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      city,
      state,
      search,
      minPrice,
      maxPrice,
      priceType,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter: any = { isActive: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (city) {
      filter["location.city"] = new RegExp(city as string, "i");
    }

    if (state) {
      filter["location.state"] = new RegExp(state as string, "i");
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (priceType) {
      filter["price.type"] = priceType;
    }

    if (minPrice || maxPrice) {
      filter["price.amount"] = {};
      if (minPrice) filter["price.amount"].$gte = Number(minPrice);
      if (maxPrice) filter["price.amount"].$lte = Number(maxPrice);
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching services",
    });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id).populate("serviceProviderId", "name email phone businessName rating totalReviews");

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { service },
    });
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching service",
    });
  }
};

// Get services by service provider
export const getServicesByProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const services = await Service.find({ serviceProviderId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error("Get provider services error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching services",
    });
  }
};

// Update service
export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can update services",
      });
      return;
    }

    const service = await Service.findOne({ _id: id, serviceProviderId: user._id });

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found or you don't have permission to update it",
      });
      return;
    }

    const allowedUpdates = [
      "title",
      "description",
      "category",
      "price",
      "location",
      "availability",
      "images",
      "tags",
      "duration",
      "requirements",
      "isActive",
    ];

    const updates: any = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedService = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: { service: updatedService },
    });
  } catch (error: any) {
    console.error("Update service error:", error);
    
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
      message: "Internal server error while updating service",
    });
  }
};

// Delete service
export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can delete services",
      });
      return;
    }

    const service = await Service.findOneAndDelete({ _id: id, serviceProviderId: user._id });

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found or you don't have permission to delete it",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting service",
    });
  }
};

// Get service categories
export const getServiceCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = [
      "Cleaning",
      "Plumbing",
      "Electrical",
      "Carpentry",
      "Painting",
      "Gardening",
      "Moving",
      "Tutoring",
      "Pet Care",
      "Home Repair",
      "Beauty & Wellness",
      "Photography",
      "Event Planning",
      "IT Support",
      "Other",
    ];

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching categories",
    });
  }
};
