'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/lib/api';

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: {
    type: 'fixed' | 'hourly' | 'negotiable';
    amount?: number;
    currency: string;
  };
  location: {
    city: string;
    state: string;
  };
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

const MyServicesPage: React.FC = () => {
  const { user, isServiceProvider } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isServiceProvider) {
      fetchMyServices();
    }
  }, [isServiceProvider]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/provider/my-services');
      if (response.data.success) {
        setServices(response.data.data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      await api.put(`/services/${serviceId}`, { isActive: !currentStatus });
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isActive: !currentStatus }
          : service
      ));
    } catch (error) {
      console.error('Error updating service status:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await api.delete(`/services/${serviceId}`);
      setServices(services.filter(service => service._id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const formatPrice = (price: Service['price']) => {
    if (price.type === 'negotiable') return 'Negotiable';
    if (!price.amount) return 'Contact for price';
    
    const amount = `$${price.amount}`;
    return price.type === 'hourly' ? `${amount}/hr` : amount;
  };

  if (!isServiceProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">This page is only available to service providers.</p>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-600 mt-2">Manage your service offerings</p>
          </div>
          <Link
            href="/services/create"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Service
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first service offering</p>
            <Link
              href="/services/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {service.images.length > 0 && (
                  <img
                    src={service.images[0]}
                    alt={service.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {service.title}
                    </h3>
                    <div className="flex items-center ml-2">
                      <button
                        onClick={() => toggleServiceStatus(service._id, service.isActive)}
                        className={`transition-colors ${service.isActive ? 'text-green-600' : 'text-gray-400'}`}
                        title={service.isActive ? 'Active - Click to disable' : 'Inactive - Click to enable'}
                      >
                        {service.isActive ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      {service.location.city}, {service.location.state}
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(service.price)}
                    </div>
                  </div>

                  {service.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                      {service.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {service.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{service.tags.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/services/${service._id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    
                    <Link
                      href={`/services/edit/${service._id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => deleteService(service._id)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Created {new Date(service.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServicesPage;
