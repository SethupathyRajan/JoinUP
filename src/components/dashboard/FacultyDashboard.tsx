import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { analyticsService } from '../../services/analyticsService';
import { registrationService } from '../../services/registrationService';
import { hackathonService } from '../../services/hackathonService';
import { Analytics, Registration } from '../../types';
import toast from 'react-hot-toast';

export const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsData, registrationsData] = await Promise.all([
          analyticsService.getDashboardStats().catch(() => null),
          registrationService.getRegistrations().catch(() => [])
        ]);
        
        setAnalytics(analyticsData);
        // Filter for pending registrations only
        setPendingRegistrations(registrationsData.filter(r => r.status === 'pending'));
      } catch (error) {
        console.error('Error fetching faculty dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApproveRegistration = async (id: string) => {
    try {
      await registrationService.updateRegistrationStatus(id, 'approved');
      setPendingRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success('Registration approved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (id: string) => {
    try {
      await registrationService.updateRegistrationStatus(id, 'rejected');
      setPendingRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success('Registration rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject registration');
    }
  };

  const stats = [
    {
      title: 'Total Students',
      value: analytics?.totalStudents?.toString() || '0',
      icon: UsersIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Active Competitions',
      value: analytics?.totalHackathons?.toString() || '0',
      icon: TrophyIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Pending Approvals',
      value: pendingRegistrations.length.toString(),
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Total Registrations',
      value: analytics?.totalRegistrations?.toString() || '0',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Faculty Dashboard 📊
        </h1>
        <p className="text-blue-100">
          Manage competitions and track student participation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pendingRegistrations.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : pendingRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              pendingRegistrations.slice(0, 5).map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{registration.userId}</h3>
                    <p className="text-sm text-gray-600">{registration.hackathonId}</p>
                    <p className="text-xs text-gray-500">
                      {registration.teamName && `Team: ${registration.teamName} • `}
                      Priority: {registration.priority}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(registration.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproveRegistration(registration.id)}
                      className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectRegistration(registration.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {Math.round(analytics.approvalRate || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Faculty</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.totalFaculty || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-sm font-medium text-blue-600">
                  +{Object.values(analytics.monthlyParticipation || {}).pop() || 0}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No statistics available</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/competitions')}
            className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-medium">Create Competition</span>
          </button>
          <button 
            onClick={() => window.location.reload()} // Refresh to show new data
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Review Approvals</span>
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">View Analytics</span>
          </button>
          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <UsersIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">View Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};