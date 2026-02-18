import { Request, Response } from "express";
import User from "../models/User";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, userType, businessName, businessDescription, services, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Create user data object
    const userData: any = {
      name,
      email,
      password,
      phone,
      userType,
      address,
    };

    // Add service provider specific fields
    if (userType === "service_provider") {
      userData.businessName = businessName;
      userData.businessDescription = businessDescription;
      userData.services = services || [];
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          isVerified: user.isVerified,
          businessName: user.businessName,
          businessDescription: user.businessDescription,
          services: user.services,
          address: user.address,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Handle validation errors
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
      message: "Internal server error during registration",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          isVerified: user.isVerified,
          businessName: user.businessName,
          businessDescription: user.businessDescription,
          services: user.services,
          rating: user.rating,
          totalReviews: user.totalReviews,
          address: user.address,
          availability: user.availability,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          isVerified: user.isVerified,
          avatar: user.avatar,
          businessName: user.businessName,
          businessDescription: user.businessDescription,
          services: user.services,
          experienceYears: user.experienceYears,
          rating: user.rating,
          totalReviews: user.totalReviews,
          address: user.address,
          savedAddresses: user.savedAddresses,
          availability: user.availability,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving profile",
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const {
      name,
      phone,
      avatar,
      address,
      businessName,
      businessDescription,
      services,
      experienceYears,
      availability,
    } = req.body;

    // Update allowed fields
    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (address !== undefined) updateFields.address = address;

    // Service provider specific updates
    if (user.userType === "service_provider") {
      if (businessName !== undefined) updateFields.businessName = businessName;
      if (businessDescription !== undefined) updateFields.businessDescription = businessDescription;
      if (services !== undefined) updateFields.services = services;
      if (experienceYears !== undefined) updateFields.experienceYears = experienceYears;
      if (availability !== undefined) updateFields.availability = availability;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    
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
      message: "Internal server error while updating profile",
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const userWithPassword = await User.findById(user._id).select("+password");
    if (!userWithPassword) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while changing password",
    });
  }
};

// Logout user (in a real app, you might want to blacklist the token)
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

// Verify account (placeholder for email verification)
export const verifyAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    console.error("Verify account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during account verification",
    });
  }
};
