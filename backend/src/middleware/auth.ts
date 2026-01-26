import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { verifyToken } from "../utils/jwt";

// Extend Request interface to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

// General authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided or invalid format.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Access denied. User not found.",
        });
        return;
      }

      if (!user.isVerified) {
        res.status(401).json({
          success: false,
          message: "Access denied. Please verify your account first.",
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: "Access denied. Invalid token.",
      });
      return;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

// Middleware to check if user is a service provider
export const authorizeServiceProvider = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.user.userType !== "service_provider") {
    res.status(403).json({
      success: false,
      message: "Access denied. Service provider privileges required.",
    });
    return;
  }

  next();
};

// Middleware to check if user is a customer
export const authorizeCustomer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (req.user.userType !== "customer") {
    res.status(403).json({
      success: false,
      message: "Access denied. Customer privileges required.",
    });
    return;
  }

  next();
};

// Middleware to allow both customer and service provider
export const authorizeUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  // Allow both customer and service_provider
  if (!["customer", "service_provider"].includes(req.user.userType)) {
    res.status(403).json({
      success: false,
      message: "Access denied. Invalid user type.",
    });
    return;
  }

  next();
};
