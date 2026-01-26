import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login for auth-related 401s, not for missing endpoints
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                            error.response?.data?.message?.includes('token') ||
                            error.response?.data?.message?.includes('Authentication required');
      
      if (isAuthEndpoint) {
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'customer' | 'service_provider';
  isVerified: boolean;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  savedAddresses?: SavedAddress[];
  // Service provider fields
  businessName?: string;
  businessDescription?: string;
  services?: string[];
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedAddress {
  _id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: {
    amount: number;
    type: 'fixed' | 'hourly' | 'negotiable';
    currency: string;
  };
  serviceProviderId: string;
  serviceProvider: {
    name: string;
    businessName: string;
    rating: number;
    totalReviews: number;
    avatar?: string;
  };
  location: {
    city: string;
    state: string;
    zipCode?: string;
    address?: string;
  };
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  images: string[];
  tags: string[];
  duration?: {
    estimated: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  rating: number;
  totalBookings: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  customerId: string;
  serviceProviderId: string;
  serviceId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  serviceProvider: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  };
  service: {
    title: string;
    category: string;
    price: {
      amount: number;
      type: string;
      currency: string;
    };
  };
  bookingDate: string;
  timeSlot: {
    start: string;
    end: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  rating?: number;
  review?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketId: string;
  userId: string;
  bookingId?: string;
  type: 'complaint' | 'support' | 'feedback' | 'refund_request' | 'technical_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: {
    sender: string;
    senderName: string;
    senderType: 'user' | 'admin' | 'system';
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
  errors?: string[];
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: 'customer' | 'service_provider';
  businessName?: string;
  businessDescription?: string;
  services?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

// Auth API functions
export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<AuthResponse> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    Cookies.remove('token');
    Cookies.remove('refreshToken');
  },

  verifyAccount: async (email: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-account', { email });
    return response.data;
  },
};

// Service API functions
export const serviceAPI = {
  getServices: async (params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await api.get(`/services${queryString}`);
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  getMyServices: async () => {
    const response = await api.get('/services/provider/my-services');
    return response.data;
  },

  createService: async (data: any) => {
    const response = await api.post('/services', data);
    return response.data;
  },

  updateService: async (id: string, data: any) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/services/categories');
    return response.data;
  },
};

// Booking API functions
export const bookingAPI = {
  createBooking: async (data: {
    serviceId: string;
    bookingDate: string;
    timeSlot: { start: string; end: string };
    address: SavedAddress;
    notes?: string;
    paymentMethod?: string;
  }) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getMyBookings: async (params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await api.get(`/bookings${queryString}`);
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id: string, reason: string) => {
    const response = await api.patch(`/bookings/${id}/cancel`, {
      cancellationReason: reason,
    });
    return response.data;
  },

  rescheduleBooking: async (id: string, newDate: string, newTimeSlot: { start: string; end: string }) => {
    const response = await api.patch(`/bookings/${id}/reschedule`, {
      newBookingDate: newDate,
      newTimeSlot,
    });
    return response.data;
  },

  rateService: async (id: string, rating: number, review: string) => {
    const response = await api.patch(`/bookings/${id}/rate`, {
      rating,
      review,
    });
    return response.data;
  },
};

// Address API functions
export const addressAPI = {
  getSavedAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  addSavedAddress: async (address: Omit<SavedAddress, '_id'>) => {
    const response = await api.post('/addresses', address);
    return response.data;
  },

  updateSavedAddress: async (id: string, address: Omit<SavedAddress, '_id'>) => {
    const response = await api.put(`/addresses/${id}`, address);
    return response.data;
  },

  deleteSavedAddress: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};

// Support API functions
export const supportAPI = {
  createTicket: async (data: {
    type: string;
    subject: string;
    description: string;
    bookingId?: string;
    priority?: string;
  }) => {
    const response = await api.post('/support', data);
    return response.data;
  },

  getMyTickets: async (params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await api.get(`/support${queryString}`);
    return response.data;
  },

  getTicketById: async (id: string) => {
    const response = await api.get(`/support/${id}`);
    return response.data;
  },

  addMessage: async (id: string, message: string) => {
    const response = await api.post(`/support/${id}/messages`, { message });
    return response.data;
  },

  closeTicket: async (id: string) => {
    const response = await api.patch(`/support/${id}/close`);
    return response.data;
  },
};

export default api;
