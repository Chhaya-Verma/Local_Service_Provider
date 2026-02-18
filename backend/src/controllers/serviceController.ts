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

    // Validate required fields
    if (!title || !description || !category || !price) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, category, price",
      });
      return;
    }

    // Validate price object
    if (!price.amount || !price.type) {
      res.status(400).json({
        success: false,
        message: "Price must have amount and type fields",
      });
      return;
    }

    if (price.amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Price amount must be greater than 0",
      });
      return;
    }

    // Create service with provider info
    const service = new Service({
      title: title.trim(),
      description: description.trim(),
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
        zipCode: user.address?.zipCode || "",
        coordinates: user.address?.coordinates,
      },
      availability: availability || user.availability || {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeSlots: [{ start: "09:00", end: "17:00" }],
      },
      images: Array.isArray(images) ? images : [],
      tags: Array.isArray(tags) ? tags : [],
      duration: duration || { estimated: 1, unit: "hours" },
      requirements: Array.isArray(requirements) ? requirements : [],
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
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all services (with filtering and search)
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
      rating,
    } = req.query;

    // Build filter
    const filter: any = { isActive: true };

    // Category filter
    if (category && category !== "all" && category !== "") {
      filter.category = String(category);
    }

    // Location filters (case-insensitive)
    if (city && city !== "") {
      filter["location.city"] = { $regex: String(city), $options: "i" };
    }

    if (state && state !== "") {
      filter["location.state"] = { $regex: String(state), $options: "i" };
    }

    // Full text search on title, description, and tags
    if (search && search !== "") {
      filter.$or = [
        { title: { $regex: String(search), $options: "i" } },
        { description: { $regex: String(search), $options: "i" } },
        { tags: { $in: [new RegExp(String(search), "i")] } },
      ];
    }

    // Price type filter
    if (priceType && priceType !== "") {
      filter["price.type"] = String(priceType);
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter["price.amount"] = {};
      if (minPrice && minPrice !== "") {
        filter["price.amount"].$gte = Number(minPrice);
      }
      if (maxPrice && maxPrice !== "") {
        filter["price.amount"].$lte = Number(maxPrice);
      }
    }

    // Minimum rating filter
    if (rating && rating !== "") {
      filter.rating = { $gte: Number(rating) };
    }

    // Pagination validation
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Sort validation
    const validSortFields = [
      "createdAt",
      "rating",
      "price.amount",
      "totalBookings",
      "totalReviews",
    ];
    const sortField = validSortFields.includes(String(sortBy))
      ? String(sortBy)
      : "createdAt";
    const sortDirection = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const sort: any = {};
    sort[sortField] = sortDirection;

    // Execute query
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Services retrieved successfully",
      data: {
        services,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore: pageNum < Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching services",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
      return;
    }

    const service = await Service.findById(id).populate(
      "serviceProviderId",
      "name email phone businessName rating totalReviews avatar availability"
    );

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Service retrieved successfully",
      data: { service },
    });
  } catch (error: any) {
    console.error("Get service error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get services by service provider
export const getServicesByProvider = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { status = "all" } = req.query;

    const filter: any = { serviceProviderId: user._id };

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const services = await Service.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Provider services retrieved successfully",
      data: {
        services,
        count: services.length,
      },
    });
  } catch (error: any) {
    console.error("Get provider services error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching services",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update service
export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = String(req.params.id);

    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can update services",
      });
      return;
    }

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
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
      if (req.body[field] !== undefined && req.body[field] !== null) {
        updates[field] = req.body[field];
      }
    });

    // Validate price if being updated
    if (updates.price) {
      if (!updates.price.amount || !updates.price.type) {
        res.status(400).json({
          success: false,
          message: "Price must have amount and type fields",
        });
        return;
      }
      if (updates.price.amount <= 0) {
        res.status(400).json({
          success: false,
          message: "Price amount must be greater than 0",
        });
        return;
      }
    }

    // Update updatedAt timestamp
    updates.updatedAt = new Date();

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
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete service
export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = String(req.params.id);

    if (!user || user.userType !== "service_provider") {
      res.status(403).json({
        success: false,
        message: "Only service providers can delete services",
      });
      return;
    }

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid service ID format",
      });
      return;
    }

    const service = await Service.findOneAndDelete({
      _id: id,
      serviceProviderId: user._id,
    });

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
      data: { deletedService: service },
    });
  } catch (error: any) {
    console.error("Delete service error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting service",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
