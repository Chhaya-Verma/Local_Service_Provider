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
      // Token expired or invalid
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
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
  // Service provider fields
  businessName?: string;
  businessDescription?: string;
  services?: string[];
  experienceYears?: number;
  rating?: number;
  totalReviews?: number;
  availability?: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
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

export default api;
