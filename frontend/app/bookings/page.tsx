'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import {
  Calendar, MapPin, Clock, DollarSign, ArrowRight,
  AlertCircle, CheckCircle, XCircle, Loader2, Phone, Mail
} from 'lucide-react';
import { bookingAPI } from '../../src/lib/api';
import Link from 'next/link';

interface BookingData {
  _id: string;
  serviceId: {
    _id: string;
    title: string;
    price: {
      amount: number;
      type: 'fixed' | 'hourly' | 'negotiable';
      currency: string;
    };
    images: string[];
    serviceProvider: {
      businessName: string;
      avatar?: string;
    };
  };
  customerId: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  serviceProviderId?: string;
  bookingDate: string;
  timeSlot: { start: string; end: string };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  address: {
    label?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  paymentMethod?: string;
  totalPrice?: number;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

const BookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isServiceProvider = user?.userType === 'service_provider';
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Both customers and service providers can view this page
    fetchBookings();
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (e: React.MouseEvent, bookingId: string) => {
    e.preventDefault();
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, { status: 'confirmed' });
      if (response?.success) {
        fetchBookings();
        alert('Booking accepted successfully!');
      }
    } catch (error: any) {
      console.error('Failed to accept booking:', error);
      alert(error.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (e: React.MouseEvent, bookingId: string) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to reject this booking?')) return;
    
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, { status: 'cancelled' });
      if (response?.success) {
        fetchBookings();
        alert('Booking rejected successfully!');
      }
    } catch (error: any) {
      console.error('Failed to reject booking:', error);
      alert(error.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteBooking = async (e: React.MouseEvent, bookingId: string) => {
    e.preventDefault();
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, { status: 'completed' });
      if (response?.success) {
        fetchBookings();
        alert('Booking marked as completed!');
      }
    } catch (error: any) {
      console.error('Failed to complete booking:', error);
      alert(error.response?.data?.message || 'Failed to complete booking');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: { bg: string; text: string; icon: React.ReactNode };
    } = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <AlertCircle className="h-4 w-4" />,
      },
      confirmed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      in_progress: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="h-4 w-4" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className={`flex items-center space-x-1 ${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {config.icon}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </div>
    );
  };

  const formatPrice = (price: BookingData['serviceId']['price']) => {
    if (price.type === 'negotiable') return 'Negotiable';
    if (!price.amount) return 'Contact for price';

    const symbol = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : '₹';
    const amount = `${symbol}${price.amount}`;
    return price.type === 'hourly' ? `${amount}/hr` : amount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isServiceProvider ? 'Booking Requests' : 'My Bookings'}
          </h1>
          <p className="text-gray-600">
            {isServiceProvider
              ? 'Manage service requests from customers'
              : 'Track and manage all your service bookings'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {isServiceProvider
            ? (['all', 'pending', 'confirmed', 'in_progress', 'completed'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all'
                      ? 'All Requests'
                      : status === 'in_progress'
                      ? 'In Progress'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )
            : (['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all' ? 'All Bookings' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                )
              )}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet."
                : `No ${filter} bookings found.`}
            </p>
            <Link
              href="/services"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {isServiceProvider ? (
                  // SERVICE PROVIDER VIEW
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.serviceId?.title || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          👤 Customer: {booking.customer?.name || 'Unknown'}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Name</p>
                          <p className="font-medium">{booking.customer?.name || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-blue-600" />
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{booking.customer?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-blue-600" />
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium text-sm">{booking.customer?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-gray-600 text-sm">Date</p>
                        <p className="font-semibold">
                          {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Time</p>
                        <p className="font-semibold">{booking.timeSlot.start} - {booking.timeSlot.end}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Amount</p>
                        <p className="font-semibold text-blue-600">${booking.totalPrice || booking.serviceId?.price?.amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Location</p>
                        <p className="font-semibold">{booking.address.city}</p>
                      </div>
                    </div>

                    {/* Service Location */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={20} className="text-red-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Service Location</p>
                          <p className="text-gray-700">{booking.address.street}</p>
                          <p className="text-gray-700">{booking.address.city}, {booking.address.state} {booking.address.zipCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => handleAcceptBooking(e, booking._id)}
                            disabled={actionLoading === booking._id}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            {actionLoading === booking._id ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={(e) => handleRejectBooking(e, booking._id)}
                            disabled={actionLoading === booking._id}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle size={18} />
                            {actionLoading === booking._id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          onClick={(e) => handleCompleteBooking(e, booking._id)}
                          disabled={actionLoading === booking._id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          {actionLoading === booking._id ? 'Completing...' : 'Mark Complete'}
                        </button>
                      )}

                      {['completed', 'cancelled'].includes(booking.status) && (
                        <button disabled className="flex-1 bg-gray-200 text-gray-600 font-semibold py-2 px-4 rounded-lg cursor-default">
                          {booking.status === 'completed' ? '✓ Completed' : '✗ Cancelled'}
                        </button>
                      )}

                      <Link
                        href={`/bookings/${booking._id}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ) : (
                  // CUSTOMER VIEW
                  <Link href={`/bookings/${booking._id}`}>
                    <div className="flex flex-col sm:flex-row cursor-pointer">
                      {/* Image */}
                      <div className="sm:w-32 sm:h-32 flex-shrink-0">
                        {booking.serviceId?.images?.[0] ? (
                          <img
                            src={booking.serviceId.images[0]}
                            alt={booking.serviceId?.title || 'Service'}
                            className="w-full h-32 sm:h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.serviceId?.title || 'Service'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                by {booking.serviceId?.serviceProvider?.businessName || 'Service Provider'}
                              </p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {/* Date & Time */}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            {/* Time Slot */}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {booking.timeSlot.start} - {booking.timeSlot.end}
                              </span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{booking.address.city}</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center space-x-2 text-sm font-semibold text-blue-600">
                              <DollarSign className="h-4 w-4" />
                              <span>${booking.totalPrice || booking.serviceId.price?.amount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rating for completed bookings */}
                        {booking.status === 'completed' && (
                          <div className="mt-4 pt-4 border-t">
                            {booking.rating ? (
                              <p className="text-sm text-gray-600">
                                ⭐ You rated this service: <span className="font-semibold">{booking.rating}/5</span>
                              </p>
                            ) : (
                              <p className="text-sm text-orange-600">
                                📝 Please rate and review this service
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center pr-4 sm:pr-6">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
