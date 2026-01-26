'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { addressAPI, authAPI, SavedAddress } from '../../src/lib/api';
import { 
  User, Mail, Phone, MapPin, Building, Star, Edit, Save, X, Plus, Trash2,
  Key, Camera, Clock
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    businessDescription: user?.businessDescription || '',
    services: user?.services?.join(', ') || '',
    experienceYears: user?.experienceYears?.toString() || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
    },
  });

  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        businessDescription: user.businessDescription || '',
        services: user.services?.join(', ') || '',
        experienceYears: user.experienceYears?.toString() || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
        },
      });
      
      if (user.userType === 'customer') {
        fetchAddresses();
      }
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getSavedAddresses();
      setAddresses(response.data.savedAddresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData = {
        ...formData,
        services: formData.services ? formData.services.split(',').map(s => s.trim()) : [],
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
      };

      await updateProfile(updateData);
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await addressAPI.updateSavedAddress(editingAddress._id!, addressForm);
      } else {
        await addressAPI.addSavedAddress(addressForm);
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        label: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
      });
      fetchAddresses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await addressAPI.deleteSavedAddress(addressId);
      fetchAddresses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault,
    });
    setShowAddressForm(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    try {
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      alert('Password changed successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    ...(user.userType === 'customer' ? [
      { id: 'addresses', label: 'Saved Addresses', icon: MapPin }
    ] : []),
    { id: 'security', label: 'Security', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {user.email}
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {user.phone}
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.userType === 'service_provider' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.userType === 'service_provider' ? 'Service Provider' : 'Customer'}
                  </span>
                </div>
              </div>
              {user.userType === 'service_provider' && user.rating && (
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium">{user.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({user.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={!isEditing}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {user.userType === 'service_provider' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={formData.businessName}
                            onChange={(e) => handleInputChange('businessName', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            disabled={!isEditing}
                            value={formData.experienceYears}
                            onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Description
                          </label>
                          <textarea
                            rows={3}
                            disabled={!isEditing}
                            value={formData.businessDescription}
                            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Services (comma-separated)
                          </label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={formData.services}
                            onChange={(e) => handleInputChange('services', e.target.value)}
                            placeholder="e.g. Plumbing, Electrical, Handyman"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Address Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.address.street}
                          onChange={(e) => handleInputChange('address.street', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={formData.address.zipCode}
                          onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4" />
                        <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && user.userType === 'customer' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Saved Addresses</h3>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Address</span>
                  </button>
                </div>

                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{address.label}</h4>
                              {address.isDefault && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              {address.street}<br />
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address._id!)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                    <p className="text-gray-500 mb-4">Add your addresses for faster booking</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Add Your First Address
                    </button>
                  </div>
                )}

                {/* Address Form Modal */}
                {showAddressForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Label
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Home, Work, etc."
                              value={addressForm.label}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Street Address
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.street}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                required
                                value={addressForm.city}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                              </label>
                              <input
                                type="text"
                                required
                                value={addressForm.state}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.zipCode}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isDefault"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                              Set as default address
                            </label>
                          </div>

                          <div className="flex space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                setAddressForm({
                                  label: '',
                                  street: '',
                                  city: '',
                                  state: '',
                                  zipCode: '',
                                  isDefault: false,
                                });
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              {editingAddress ? 'Update' : 'Add'} Address
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Security Settings</h3>
                
                <div className="space-y-8">
                  {/* Password Change */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="submit"
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Key className="h-4 w-4" />
                        <span>Change Password</span>
                      </button>
                    </form>
                  </div>

                  {/* Account Status */}
                  <div className="border-t pt-8">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Account Status</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Email Verification</h5>
                          <p className="text-sm text-gray-600">Your email address verification status</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Account Created</h5>
                          <p className="text-sm text-gray-600">Member since</p>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
