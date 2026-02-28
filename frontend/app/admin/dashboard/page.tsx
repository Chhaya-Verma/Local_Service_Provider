'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/context/AuthContext';
import { LogOut, Users, Briefcase, Calendar, BarChart3, Mail, Phone, MapPin, Star } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface DashboardStats {
  totalUsers: number;
  totalServiceProviders: number;
  totalServices: number;
  totalBookings: number;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { user, isAdmin, logout, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalServiceProviders: 0,
    totalServices: 0,
    totalBookings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'providers' | 'services' | 'bookings'>('overview');

  useEffect(() => {
    // Redirect non-admin users
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = Cookies.get('token');
      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      // Fetch all data from admin endpoints
      const statsRes = await axios.get(`${apiUrl}/admin/stats`, { headers });

      if (statsRes.data?.data?.stats) {
        setStats(statsRes.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default stats on error
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                Admin Panel - Manage all platform services and users
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? '-' : stats.totalUsers}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Service Providers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? '-' : stats.totalServiceProviders}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? '-' : stats.totalServices}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? '-' : stats.totalBookings}
                </p>
              </div>
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
                { id: 'users' as const, label: 'Users', icon: Users },
                { id: 'providers' as const, label: 'Providers', icon: Briefcase },
                { id: 'services' as const, label: 'Services', icon: BarChart3 },
                { id: 'bookings' as const, label: 'Bookings', icon: Calendar },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === id
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">User Statistics</h3>
                <p className="text-gray-600">
                  Total {stats.totalUsers} users with {stats.totalServiceProviders} service providers
                </p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Service Statistics</h3>
                <p className="text-gray-600">
                  {stats.totalServices} services with {stats.totalBookings} total bookings
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Users</h2>
            <p className="text-gray-600">
              Total Users: {stats.totalUsers}
            </p>
            <p className="text-gray-500 mt-4">Detailed user management coming soon...</p>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Providers</h2>
            <p className="text-gray-600">
              Total Service Providers: {stats.totalServiceProviders}
            </p>
            <p className="text-gray-500 mt-4">Service provider management coming soon...</p>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
            <p className="text-gray-600">
              Total Services: {stats.totalServices}
            </p>
            <p className="text-gray-500 mt-4">Service management coming soon...</p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h2>
            <p className="text-gray-600">
              Total Bookings: {stats.totalBookings}
            </p>
            <p className="text-gray-500 mt-4">Booking management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
