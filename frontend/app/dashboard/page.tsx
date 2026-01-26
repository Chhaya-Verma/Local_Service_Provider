'use client';

import React from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { User, Mail, Phone, MapPin, Building, Star, Calendar, Clock } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {user.userType === 'customer' 
                  ? 'Find and book local services in your area'
                  : 'Manage your services and connect with customers'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>

                {user.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">
                        {user.address.city}, {user.address.state}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        const created = (user as any).createdAt ?? (user as any).created_at ?? '';
                        return created ? new Date(created).toLocaleDateString() : '';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Provider Specific Info */}
            {user.userType === 'service_provider' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-medium text-gray-900">{user.businessName}</p>
                    </div>
                  </div>

                  {user.businessDescription && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Business Description</p>
                      <p className="text-gray-900">{user.businessDescription}</p>
                    </div>
                  )}

                  {user.services && user.services.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Services Offered</p>
                      <div className="flex flex-wrap gap-2">
                        {user.services.map((service, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="font-medium text-gray-900">
                          {user.rating || 0}/5 ({user.totalReviews || 0} reviews)
                        </p>
                      </div>
                    </div>

                    {user.experienceYears !== undefined && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="font-medium text-gray-900">
                            {user.experienceYears} years
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                {user.userType === 'customer' ? (
                  <>
                    <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <h3 className="font-medium text-blue-900">Browse Services</h3>
                      <p className="text-sm text-blue-600">Find local service providers</p>
                    </button>
                    <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <h3 className="font-medium text-green-900">My Bookings</h3>
                      <p className="text-sm text-green-600">View your service bookings</p>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <h3 className="font-medium text-blue-900">Add Service</h3>
                      <p className="text-sm text-blue-600">Create new service offering</p>
                    </button>
                    <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                      <h3 className="font-medium text-green-900">My Services</h3>
                      <p className="text-sm text-green-600">Manage your services</p>
                    </button>
                    <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                      <h3 className="font-medium text-purple-900">Bookings</h3>
                      <p className="text-sm text-purple-600">View customer bookings</p>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs capitalize">
                    {user.userType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
