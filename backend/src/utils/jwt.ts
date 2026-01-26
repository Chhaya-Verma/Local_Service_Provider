import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

interface JWTPayload {
  userId: string;
  email: string;
  userType: "customer" | "service_provider";
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  };

  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};
