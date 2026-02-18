'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../src/context/AuthContext';
import {
  ArrowLeft, Calendar, MapPin, Clock, DollarSign, Phone, Mail,
  AlertCircle, CheckCircle, XCircle, Star, MessageSquare
} from 'lucide-react';
import { bookingAPI } from '../../../src/lib/api';
import Link from 'next/link';

interface BookingData {
  _id: string;
  serviceId: {
    _id: string;
    title: string;
    description: string;
    price: {
      amount: number;
      type: 'fixed' | 'hourly' | 'negotiable';
      currency: string;
    };
    images: string[];
    category: string;
    serviceProvider: {
      _id: string;
      businessName: string;
      phone: string;
      email: string;
      avatar?: string;
      rating: number;
      totalReviews: number;
    };
  };
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  serviceProviderId: string;
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

const BookingDetailPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    review: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (id) {
      fetchBooking();
    }
  }, [id, isAuthenticated]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingById(id as string);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking) return;

    const newDate = prompt('Enter new booking date (YYYY-MM-DD):');
    if (!newDate) return;

    const startTime = prompt('Enter start time (HH:mm):');
    if (!startTime) return;

    const endTime = prompt('Enter end time (HH:mm):');
    if (!endTime) return;

    setActionLoading(true);
    try {
      await bookingAPI.rescheduleBooking(booking._id, newDate, {
        start: startTime,
        end: endTime,
      });
      alert('Booking rescheduled successfully!');
      await fetchBooking();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reschedule booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    const confirmed = confirm('Are you sure you want to cancel this booking? This action cannot be undone.');
    if (!confirmed) return;

    const reason = prompt('Please tell us why you are cancelling:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await bookingAPI.cancelBooking(booking._id, reason);
      alert('Booking cancelled successfully!');
      await fetchBooking();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setActionLoading(true);
    try {
      await bookingAPI.rateService(booking._id, ratingForm.rating, ratingForm.review);
      alert('Thank you for your rating!');
      setShowRatingModal(false);
      await fetchBooking();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptBooking = async () => {
    if (!booking) return;

    const confirmed = confirm('Are you sure you want to accept this booking?');
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // We'll need to create an acceptBooking API endpoint
      await fetch(`/api/bookings/${booking._id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      alert('Booking accepted successfully!');
      await fetchBooking();
    } catch (error: any) {
      alert(error.message || 'Failed to accept booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!booking) return;

    const reason = prompt('Please tell us why you are rejecting this booking:');
    if (!reason) return;

    setActionLoading(true);
    try {
      // We'll need to create a rejectBooking API endpoint
      await fetch(`/api/bookings/${booking._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      alert('Booking rejected successfully!');
      await fetchBooking();
    } catch (error: any) {
      alert(error.message || 'Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: { bg: string; text: string; icon: React.ReactNode };
    } = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <AlertCircle className="h-5 w-5" />,
      },
      confirmed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <CheckCircle className="h-5 w-5" />,
      },
      in_progress: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <Clock className="h-5 w-5" />,
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="h-5 w-5" />,
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="h-5 w-5" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className={`flex items-center space-x-2 ${config.bg} ${config.text} px-4 py-2 rounded-full text-sm font-semibold w-fit`}>
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

  const isRescheduleAllowed = booking && ['pending', 'confirmed'].includes(booking.status);
  const isCancelAllowed = booking && ['pending', 'confirmed', 'in_progress'].includes(booking.status);
  const isRatingAllowed = booking && booking.status === 'completed' && !booking.rating;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Bookings
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Image Section */}
          <div className="h-64 bg-gray-200 overflow-hidden relative">
            {booking.serviceId.images?.[0] ? (
              <img
                src={booking.serviceId.images[0]}
                alt={booking.serviceId.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
            {/* Status Badge - Overlay */}
            <div className="absolute top-4 right-4">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          {/* Header Section */}
          <div className="p-6 border-b">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {booking.serviceId.title}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {booking.serviceId.category}
                </span>
                <span className="text-sm text-gray-600">
                  Booking ID: {booking._id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Time Slot</p>
                  <p className="font-semibold text-gray-900">
                    {booking.timeSlot.start} - {booking.timeSlot.end}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">
                    {booking.address.street}, {booking.address.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(booking.serviceId.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Provider Section (For Customers) / Customer Section (For Providers) */}
          <div className="p-6 bg-gray-50 border-b">
            {user?.userType === 'service_provider' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-green-600">
                      {booking.customerId?.name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {booking.customerId?.name || 'Unknown Customer'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Customer</p>
                    <div className="mt-3 space-y-2">
                      <a
                        href={`tel:${booking.customerId?.phone}`}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{booking.customerId?.phone || 'N/A'}</span>
                      </a>
                      <a
                        href={`mailto:${booking.customerId?.email}`}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{booking.customerId?.email || 'N/A'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {booking.serviceId.serviceProvider.avatar ? (
                      <img
                        src={booking.serviceId.serviceProvider.avatar}
                        alt={booking.serviceId.serviceProvider.businessName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {booking.serviceId.serviceProvider.businessName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {booking.serviceId.serviceProvider.businessName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>
                        {booking.serviceId.serviceProvider.rating.toFixed(1)} (
                        {booking.serviceId.serviceProvider.totalReviews} reviews)
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <a
                        href={`tel:${booking.serviceId.serviceProvider.phone}`}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{booking.serviceId.serviceProvider.phone}</span>
                      </a>
                      <a
                        href={`mailto:${booking.serviceId.serviceProvider.email}`}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{booking.serviceId.serviceProvider.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Booking Details Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>

            {/* Address */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Service Address</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{booking.address.label || 'Address'}</p>
                <p className="text-gray-600">{booking.address.street}</p>
                <p className="text-gray-600">
                  {booking.address.city}, {booking.address.state} {booking.address.zipCode}
                </p>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
              <p className="text-gray-600 capitalize">
                {booking.paymentMethod?.replace('_', ' ') || 'Not specified'}
              </p>
            </div>

            {/* Rating Section */}
            {booking.status === 'completed' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {booking.rating ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Rating</h4>
                    <div className="mb-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < booking.rating!
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.rating}/5 stars
                      </p>
                    </div>
                    {booking.review && (
                      <p className="text-gray-700 text-sm mt-2">"{booking.review}"</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span>Rate and Review This Service</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 border-t flex flex-wrap gap-3 justify-end">
            {user?.userType === 'service_provider' ? (
              <>
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={handleAcceptBooking}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {actionLoading ? 'Processing...' : 'Accept Booking'}
                    </button>
                    <button
                      onClick={handleRejectBooking}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      {actionLoading ? 'Processing...' : 'Reject Booking'}
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg cursor-not-allowed opacity-50 font-medium"
                    disabled
                  >
                    Booking Confirmed - Awaiting Service Date
                  </button>
                )}
                {['completed', 'cancelled'].includes(booking.status) && (
                  <Link
                    href="/bookings"
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Back to Bookings
                  </Link>
                )}
              </>
            ) : (
              <>
                {isRescheduleAllowed && (
                  <button
                    onClick={handleReschedule}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Loading...' : 'Reschedule'}
                  </button>
                )}

                {isCancelAllowed && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Loading...' : 'Cancel Booking'}
                  </button>
                )}

                {isRatingAllowed && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    Rate Service
                  </button>
                )}

                {!isRescheduleAllowed && !isCancelAllowed && !isRatingAllowed && (
                  <Link
                    href="/bookings"
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Back to Bookings
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rate This Service</h3>

            <form onSubmit={handleRating} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Rating
                </label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm(prev => ({ ...prev, rating: star }))}
                      className="p-1 transition-transform transform hover:scale-125"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= ratingForm.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Share your experience..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  value={ratingForm.review}
                  onChange={(e) =>
                    setRatingForm(prev => ({ ...prev, review: e.target.value }))
                  }
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailPage;
