import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const baseRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  userType: z.enum(['customer', 'service_provider']),
});

export const customerRegisterSchema = baseRegisterSchema.extend({
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
  }).optional(),
});

export const serviceProviderRegisterSchema = baseRegisterSchema.extend({
  businessName: z.string().min(1, 'Business name is required for service providers'),
  businessDescription: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  services: z.array(z.string()).optional(),
  experienceYears: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience cannot exceed 50 years').optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
  }).optional(),
  availability: z.object({
    days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
    timeSlots: z.array(z.object({
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    })),
  }).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CustomerRegisterFormData = z.infer<typeof customerRegisterSchema>;
export type ServiceProviderRegisterFormData = z.infer<typeof serviceProviderRegisterSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
