'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Calendar,
  Clock, MapPin, Star, MessageSquare, XCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import { serviceAPI, bookingAPI, supportAPI, Service, Booking, SupportTicket } from '../../src/lib/api';

const MyServicesPage: React.FC = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || (user?.userType === 'service_provider' ? 'services' : 'bookings');
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingFilter, setBookingFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');

  useEffect(() => {
    if (user) {
      if (activeTab === 'services' && user.userType === 'service_provider') {
        fetchMyServices();
      } else if (activeTab === 'bookings') {
        fetchMyBookings();
      } else if (activeTab === 'tickets') {
        fetchMyTickets();
      }
    }
  }, [user, activeTab, bookingFilter, ticketFilter]);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getMyServices();
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const params = bookingFilter !== 'all' ? { status: bookingFilter } : undefined;
      const response = await bookingAPI.getMyBookings(params);
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const params = ticketFilter !== 'all' ? { status: ticketFilter } : undefined;
      const response = await supportAPI.getMyTickets(params);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: Service['price']) => {
    if (price.type === 'negotiable') return 'Negotiable';
    if (!price.amount) return 'Contact for price';
    
    const symbol = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : '₹';
    const amount = `${symbol}${price.amount}`;
    return price.type === 'hourly' ? `${amount}/hr` : amount;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const reason = prompt('Please provide a reason for cancellation:') || 'Customer cancelled';
      await bookingAPI.cancelBooking(bookingId, reason);
      fetchMyBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const tabs = [
    ...(user?.userType === 'service_provider' ? [
      { id: 'services', label: 'My Services', icon: Plus }
    ] : []),
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {user.userType === 'service_provider' ? 'Manage Your Services' : 'My Bookings & Support'}
          </h1>
          <p className="text-gray-600">
            {user.userType === 'service_provider' 
              ? 'Create and manage your service listings'
              : 'View your bookings, history, and support tickets'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
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
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && user.userType === 'service_provider' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Services</h2>
              <Link
                href="/services/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Service</span>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                          {service.title}
                        </h3>
                        <div className="flex items-center ml-2">
                          {service.isActive ? (
                            <ToggleRight className="h-6 w-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {service.category}
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        {service.location.city}, {service.location.state}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/services/${service._id}`}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-center text-sm hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-200 flex items-center justify-center">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Plus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-500 mb-4">Create your first service to start receiving bookings</p>
                <Link
                  href="/services/create"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Service
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Bookings</h2>
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {booking.service.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(booking.bookingDate).toLocaleDateString()} at {booking.timeSlot.start}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {booking.address.city}, {booking.address.state}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Provider:</span>
                            <span className="ml-1">{booking.serviceProvider.businessName}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Total:</span>
                            <span className="ml-1 text-blue-600 font-semibold">${booking.totalAmount}</span>
                          </div>
                        </div>
                        
                        {booking.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Notes: </span>
                            <span className="text-sm text-gray-600">{booking.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                      
                      {booking.status === 'pending' || booking.status === 'confirmed' ? (
                        <>
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 flex items-center"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                          <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 flex items-center">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reschedule
                          </button>
                        </>
                      ) : null}
                      
                      {booking.status === 'completed' && !booking.rating && (
                        <Link
                          href={`/bookings/${booking._id}/rate`}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 flex items-center"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Rate Service
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-4">
                  {bookingFilter === 'all' 
                    ? 'Browse services to make your first booking'
                    : `No ${bookingFilter} bookings found`
                  }
                </p>
                <Link
                  href="/services"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Browse Services
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Support Tickets</h2>
              <div className="flex space-x-3">
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <Link
                  href="/support/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Ticket</span>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            #{ticket.ticketId} - {ticket.subject}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="bg-gray-100 px-2 py-1 rounded">{ticket.type}</span>
                          <span className={`px-2 py-1 rounded ${
                            ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority} priority
                          </span>
                          <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/support/${ticket._id}`}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        View & Reply
                      </Link>
                      {ticket.status !== 'closed' && (
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                          Close Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                <p className="text-gray-500 mb-4">
                  {ticketFilter === 'all' 
                    ? 'Create a support ticket if you need help'
                    : `No ${ticketFilter} tickets found`
                  }
                </p>
                <Link
                  href="/support/create"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create Support Ticket
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServicesPage;
