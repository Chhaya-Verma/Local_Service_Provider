'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../src/context/AuthContext';
import {
  customerRegisterSchema,
  serviceProviderRegisterSchema,
  CustomerRegisterFormData,
  ServiceProviderRegisterFormData,
} from '../../src/lib/validations';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  MapPin,
  Clock,
  AlertCircle,
  UserCircle,
  Briefcase,
} from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [userType, setUserType] = useState<'customer' | 'service_provider'>('customer');

  const router = useRouter();
  const { register: registerUser } = useAuth();

  const customerForm = useForm<CustomerRegisterFormData>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: { userType: 'customer' },
  });

  const serviceProviderForm = useForm<ServiceProviderRegisterFormData>({
    resolver: zodResolver(serviceProviderRegisterSchema),
    defaultValues: { userType: 'service_provider' },
  });

  const currentForm = userType === 'customer' ? customerForm : serviceProviderForm;

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await registerUser(data);

      if (response.success) {
        router.push('/dashboard');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type: 'customer' | 'service_provider') => {
    setUserType(type);
    setError('');
    // Reset forms when switching
    customerForm.reset();
    serviceProviderForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* User Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">I want to:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleUserTypeChange('customer')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                userType === 'customer'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <UserCircle className={`h-6 w-6 ${userType === 'customer' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-medium">Find Services</h4>
                  <p className="text-sm text-gray-600">Book local services and professionals</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUserTypeChange('service_provider')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                userType === 'service_provider'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Briefcase className={`h-6 w-6 ${userType === 'service_provider' ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-medium">Provide Services</h4>
                  <p className="text-sm text-gray-600">Offer your skills and grow your business</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={currentForm.handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="ml-2 text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...(currentForm.register as any)('name')}
                    type="text"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      currentForm.formState.errors.name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your full name"
                  />
                </div>
                {currentForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{currentForm.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...(currentForm.register as any)('email')}
                    type="email"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      currentForm.formState.errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your email"
                  />
                </div>
                {currentForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{currentForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...(currentForm.register as any)('phone')}
                    type="tel"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      currentForm.formState.errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="+1234567890"
                  />
                </div>
                {currentForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{currentForm.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...(currentForm.register as any)('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
                      currentForm.formState.errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {currentForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{currentForm.formState.errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Provider Specific Fields */}
          {userType === 'service_provider' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...serviceProviderForm.register('businessName')}
                    type="text"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      serviceProviderForm.formState.errors.businessName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Your business name"
                  />
                </div>
                {serviceProviderForm.formState.errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{serviceProviderForm.formState.errors.businessName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Description
                </label>
                <textarea
                  {...serviceProviderForm.register('businessDescription')}
                  rows={3}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    serviceProviderForm.formState.errors.businessDescription ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Describe your services and expertise..."
                />
                {serviceProviderForm.formState.errors.businessDescription && (
                  <p className="mt-1 text-sm text-red-600">{serviceProviderForm.formState.errors.businessDescription.message}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
