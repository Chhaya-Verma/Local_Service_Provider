'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Upload,
  FileText,
  Clock,
  DollarSign,
  Star,
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { providerApplicationAPI, Service, ProviderApplication } from '../../../src/lib/api';
import api from '../../../src/lib/api';

// Use Service type directly, it already has all needed properties
type ProviderService = Service & {
  totalRevenue?: number;
};

const ProviderDashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'services' | 'application' | 'bookings' | 'earnings'>('services');
  
  // Application state
  const [application, setApplication] = useState<ProviderApplication | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  
  // Services state
  const [services, setServices] = useState<ProviderService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    category: '',
    price: { amount: 0, type: 'fixed' as 'fixed' | 'hourly' | 'negotiable', currency: 'USD' },
    availability: {
      days: [] as string[],
      timeSlots: [{ start: '09:00', end: '17:00' }]
    },
    duration: { estimated: 60, unit: 'minutes' as 'minutes' | 'hours' | 'days' },
    requirements: [] as string[],
    tags: [] as string[]
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.userType !== 'service_provider') {
      router.push('/dashboard');
      return;
    }

    // Load initial data
    loadApplication();
    loadServices();
  }, [user, loading, router]);

  const loadApplication = async () => {
    setApplicationLoading(true);
    try {
      const response = await providerApplicationAPI.getMyApplication();
      setApplication(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading application:', error);
      }
    } finally {
      setApplicationLoading(false);
    }
  };

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const response = await api.get('/services/my-services');
      setServices(response.data.data.services);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', serviceForm);
      setShowCreateService(false);
      loadServices();
      // Reset form
      setServiceForm({
        title: '',
        description: '',
        category: '',
        price: { amount: 0, type: 'fixed', currency: 'USD' },
        availability: {
          days: [],
          timeSlots: [{ start: '09:00', end: '17:00' }]
        },
        duration: { estimated: 60, unit: 'minutes' },
        requirements: [],
        tags: []
      });
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      await api.patch(`/services/my-services/${serviceId}/toggle-status`);
      loadServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await api.delete(`/services/my-services/${serviceId}`);
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderApplicationStatus = () => {
    if (applicationLoading) {
      return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
    }

    if (!application) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Application Required</h3>
          </div>
          <p className="text-gray-600 mb-4">
            You need to submit a provider application to start offering services.
          </p>
          <button
            onClick={() => router.push('/provider/apply')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Start Application
          </button>
        </div>
      );
    }

    const statusColors = {
      pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      under_review: 'bg-blue-50 border-blue-200 text-blue-800',
      approved: 'bg-green-50 border-green-200 text-green-800',
      rejected: 'bg-red-50 border-red-200 text-red-800'
    };

    const statusClass = statusColors[application.status as keyof typeof statusColors] || statusColors.pending;

    return (
      <div className={`border rounded-lg p-6 ${statusClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-semibold">Provider Application</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium">
            {application.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-2">
          <p><strong>Business:</strong> {application.businessName}</p>
          <p><strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}</p>
          {application.rejectionReason && (
            <p><strong>Rejection Reason:</strong> {application.rejectionReason}</p>
          )}
        </div>

        {application.status === 'rejected' && (
          <button
            onClick={() => router.push('/provider/apply')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Resubmit Application
          </button>
        )}
      </div>
    );
  };

  const renderServices = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Services</h2>
          {application?.status === 'approved' && (
            <button
              onClick={() => setShowCreateService(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </button>
          )}
        </div>

        {application?.status !== 'approved' ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Your application must be approved before you can create services.
            </p>
          </div>
        ) : (
          <>
            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No services created yet.</p>
                <button
                  onClick={() => setShowCreateService(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
                >
                  Create Your First Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{service.title}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleServiceStatus(service._id)}
                          className={`p-1 rounded ${service.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                          {service.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => router.push(`/services/${service._id}`)}
                          className="p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteService(service._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{service.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">${service.price.amount}/{service.price.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Bookings:</span>
                        <span className="font-medium">{service.totalBookings || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Service Modal */}
        {showCreateService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create New Service</h2>
                  <button
                    onClick={() => setShowCreateService(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateService} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Title
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({...serviceForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Home Cleaning Service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your service..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        required
                        value={serviceForm.category}
                        onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Category</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Painting">Painting</option>
                        <option value="Gardening">Gardening</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={serviceForm.price.amount}
                          onChange={(e) => setServiceForm({
                            ...serviceForm,
                            price: {...serviceForm.price, amount: parseFloat(e.target.value) || 0}
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                        <select
                          value={serviceForm.price.type}
                          onChange={(e) => setServiceForm({
                            ...serviceForm,
                            price: {...serviceForm.price, type: e.target.value as any}
                          })}
                          className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="hourly">Per Hour</option>
                          <option value="negotiable">Negotiable</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateService(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Service
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
          <p className="text-gray-600">Manage your services, applications, and bookings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'application', label: 'Application Status', icon: FileText },
              { id: 'services', label: 'Services', icon: Users },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'earnings', label: 'Earnings', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'application' && renderApplicationStatus()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">Booking management coming soon...</p>
            </div>
          )}
          {activeTab === 'earnings' && (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">Earnings dashboard coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboardPage;
