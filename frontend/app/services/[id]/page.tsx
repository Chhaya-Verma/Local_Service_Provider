'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Star, Clock, DollarSign, Calendar, User, Phone, Mail,
  ImageIcon, ChevronLeft, ChevronRight, ArrowLeft
} from 'lucide-react';
import { serviceAPI, bookingAPI, addressAPI, Service, SavedAddress } from '../../../src/lib/api';
import { useAuth } from '../../../src/context/AuthContext';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    timeSlot: { start: '', end: '' },
    addressId: '',
    notes: '',
    paymentMethod: 'cash',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchService();
      if (user?.userType === 'customer') {
        fetchAddresses();
      }
    }
  }, [id, user]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getServiceById(id as string);
      setService(response.data.service);
    } catch (error) {
      console.error('Failed to fetch service:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await addressAPI.getSavedAddresses();
      setAddresses(response.data.savedAddresses || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const formatPrice = (price: Service['price']) => {
    if (price.type === 'negotiable') return 'Negotiable';
    if (!price.amount) return 'Contact for price';
    
    const symbol = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : '₹';
    const amount = `${symbol}${price.amount}`;
    return price.type === 'hourly' ? `${amount}/hr` : amount;
  };

  const formatDuration = (duration?: Service['duration']) => {
    if (!duration) return '';
    return `${duration.estimated} ${duration.unit}`;
  };

  const generateTimeSlots = () => {
    if (!service?.availability?.timeSlots?.length) return [];
    
    const slots = [];
    for (const timeSlot of service.availability.timeSlots) {
      const startHour = parseInt(timeSlot.start.split(':')[0]);
      const endHour = parseInt(timeSlot.end.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const start = `${hour.toString().padStart(2, '0')}:00`;
        const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
        slots.push({ start, end });
      }
    }
    return slots;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !user) return;

    setBookingLoading(true);
    try {
      const selectedAddress = addresses.find(addr => addr._id === bookingForm.addressId);
      if (!selectedAddress) {
        throw new Error('Please select an address');
      }

      const bookingData = {
        serviceId: service._id,
        bookingDate: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        address: selectedAddress,
        notes: bookingForm.notes,
        paymentMethod: bookingForm.paymentMethod,
      };

      await bookingAPI.createBooking(bookingData);
      setShowBookingModal(false);
      router.push('/my-services?tab=bookings');
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const nextImage = () => {
    if (service?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (service?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h1>
          <button
            onClick={() => router.push('/services')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {service.images.length > 0 ? (
                <div className="relative h-64 sm:h-80 lg:h-96">
                  <img
                    src={service.images[currentImageIndex]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {service.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {service.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-64 sm:h-80 lg:h-96 bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {service.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{service.rating.toFixed(1)}</span>
                      <span className="ml-1">({service.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {service.location.city}, {service.location.state}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(service.price)}
                  </div>
                  {service.duration && (
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(service.duration)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {service.category}
                </span>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {service.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Provider Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">About the Provider</h3>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  {service.serviceProvider.avatar ? (
                    <img
                      src={service.serviceProvider.avatar}
                      alt={service.serviceProvider.businessName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {service.serviceProvider.businessName}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span>{service.serviceProvider.rating.toFixed(1)}</span>
                      <span className="ml-1">({service.serviceProvider.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Book This Service</h3>
              
              {user?.userType === 'customer' ? (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(service.price)}
                  </div>
                  
                  {service.availability?.days && service.availability.days.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Available Days</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.availability.days.map((day) => (
                          <span
                            key={day}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Book Now
                  </button>
                  
                  <div className="text-sm text-gray-500 text-center">
                    Free cancellation up to 24 hours before service
                  </div>
                </div>
              ) : user?.userType === 'service_provider' ? (
                <div className="text-center text-gray-600">
                  <p>You are logged in as a service provider.</p>
                  <p className="mt-2">Switch to a customer account to book services.</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Please log in to book this service</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && user?.userType === 'customer' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Book {service.title}</h3>
              
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {generateTimeSlots().map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setBookingForm(prev => ({ ...prev, timeSlot: slot }))}
                        className={`p-2 text-sm rounded-lg border ${
                          bookingForm.timeSlot.start === slot.start
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {slot.start} - {slot.end}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Address
                  </label>
                  <select
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={bookingForm.addressId}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, addressId: e.target.value }))}
                  >
                    <option value="">Choose address...</option>
                    {addresses.map((address) => (
                      <option key={address._id} value={address._id}>
                        {address.label} - {address.street}, {address.city}
                      </option>
                    ))}
                  </select>
                  {addresses.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Please add an address in your profile first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any specific requirements or notes..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={bookingForm.paymentMethod}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Pay with Cash</option>
                    <option value="card">Pay with Card</option>
                    <option value="online">Pay Online</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading || addresses.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
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

export default ServiceDetailPage;
