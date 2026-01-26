import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Add saved address
export const addSavedAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { label, street, city, state, zipCode, isDefault, coordinates } = req.body;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      user.savedAddresses?.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Add new address
    const newAddress = {
      label,
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
      coordinates,
    };

    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    user.savedAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: { savedAddresses: user.savedAddresses },
    });
  } catch (error: any) {
    console.error("Add saved address error:", error);
    
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
      message: "Internal server error while adding address",
    });
  }
};

// Update saved address
export const updateSavedAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { addressId } = req.params;
    const { label, street, city, state, zipCode, isDefault, coordinates } = req.body;

    if (!user.savedAddresses) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    const addressIndex = user.savedAddresses.findIndex(
      addr => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address
    user.savedAddresses[addressIndex] = {
      ...user.savedAddresses[addressIndex],
      label,
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
      coordinates,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: { savedAddresses: user.savedAddresses },
    });
  } catch (error: any) {
    console.error("Update saved address error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating address",
    });
  }
};

// Delete saved address
export const deleteSavedAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { addressId } = req.params;

    if (!user.savedAddresses) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    const addressIndex = user.savedAddresses.findIndex(
      addr => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Address not found",
      });
      return;
    }

    user.savedAddresses.splice(addressIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: { savedAddresses: user.savedAddresses },
    });
  } catch (error: any) {
    console.error("Delete saved address error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting address",
    });
  }
};

// Get saved addresses
export const getSavedAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { savedAddresses: user.savedAddresses || [] },
    });
  } catch (error: any) {
    console.error("Get saved addresses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching addresses",
    });
  }
};
