import { Request, Response, NextFunction } from "express";

// Validation rules for user registration
export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, password, phone, userType, businessName } = req.body;

  // Check required fields
  if (!name || !email || !password || !phone || !userType) {
    res.status(400).json({
      success: false,
      message: "Please provide all required fields: name, email, password, phone, userType",
    });
    return;
  }

  // Validate name
  if (name.length < 2 || name.length > 50) {
    res.status(400).json({
      success: false,
      message: "Name must be between 2 and 50 characters",
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
    return;
  }

  // Validate password strength
  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
    return;
  }

  // Validate phone number
  const phoneRegex = /^\+?[\d\s-()]+$/;
  if (!phoneRegex.test(phone)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid phone number",
    });
    return;
  }

  // Validate user type
  if (!["customer", "service_provider"].includes(userType)) {
    res.status(400).json({
      success: false,
      message: "User type must be either 'customer' or 'service_provider'",
    });
    return;
  }

  // If service provider, validate business name
  if (userType === "service_provider" && (!businessName || businessName.trim().length === 0)) {
    res.status(400).json({
      success: false,
      message: "Business name is required for service providers",
    });
    return;
  }

  next();
};

// Validation rules for user login
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Please provide both email and password",
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
    return;
  }

  next();
};

// Validation rules for password change
export const validatePasswordChange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      message: "Please provide both current password and new password",
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long",
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      success: false,
      message: "New password must be different from current password",
    });
    return;
  }

  next();
};
