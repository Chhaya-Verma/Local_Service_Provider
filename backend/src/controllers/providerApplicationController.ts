import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import ProviderApplication, { IProviderApplication } from "../models/ProviderApplication";
import User from "../models/User";
import mongoose from "mongoose";

export const submitApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user already has an application
    const existingApplication = await ProviderApplication.findOne({ userId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "Application already submitted"
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const {
      businessName,
      businessDescription,
      services,
      experienceYears,
      documents,
      address
    } = req.body;

    // Create new application
    const application = new ProviderApplication({
      userId,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      businessName,
      businessDescription,
      services,
      experienceYears,
      documents,
      address,
      status: "pending"
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application
    });
  } catch (error: any) {
    console.error("Submit application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message
    });
  }
};

export const getMyApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const application = await ProviderApplication.findOne({ userId });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No application found"
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error("Get application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message
    });
  }
};

export const updateApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const application = await ProviderApplication.findOne({ userId });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Only allow updates if status is pending or rejected
    if (application.status !== "pending" && application.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot update application in current status"
      });
    }

    const updateData = req.body;
    
    // Reset status to pending if it was rejected
    if (application.status === "rejected") {
      updateData.status = "pending";
      updateData.rejectionReason = undefined;
      updateData.reviewNotes = undefined;
    }

    const updatedApplication = await ProviderApplication.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Application updated successfully",
      data: updatedApplication
    });
  } catch (error: any) {
    console.error("Update application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
      error: error.message
    });
  }
};

// Admin functions
export const getAllApplications = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin (you'll need to implement admin role)
    const user = await User.findById(req.user?._id);
    if (!user || user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query: any = {};
    
    if (status && status !== "all") {
      query.status = status;
    }

    const applications = await ProviderApplication.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate("userId", "name email phone");

    const total = await ProviderApplication.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: Number(page),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error("Get all applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message
    });
  }
};

export const reviewApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewNotes, rejectionReason } = req.body;

    // Check if user is admin
    const user = await User.findById(req.user?._id);
    if (!user || user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    if (!["approved", "rejected", "under_review"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const application = await ProviderApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Update application
    application.status = status;
    application.reviewedBy = req.user!._id;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes;
    
    if (status === "rejected" && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }

    await application.save();

    // If approved, update the user's profile
    if (status === "approved") {
      await User.findByIdAndUpdate(application.userId, {
        businessName: application.businessName,
        businessDescription: application.businessDescription,
        services: application.services,
        experienceYears: application.experienceYears,
        isVerified: true
      });
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });
  } catch (error: any) {
    console.error("Review application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review application",
      error: error.message
    });
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentType } = req.params;

    // For now, just return a mock URL since we don't have file storage setup
    const mockUrl = `https://example.com/uploads/${documentType}_${Date.now()}.jpg`;

    res.json({
      success: true,
      data: {
        url: mockUrl,
        documentType
      }
    });
  } catch (error: any) {
    console.error("Upload document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message
    });
  }
};
