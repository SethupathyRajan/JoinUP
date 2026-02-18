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
import { userProfileService } from '../../services/userProfileService';
import { Analytics, Registration, Hackathon } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export const FacultyDashboard: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]); // Enriched registration data
  const [pendingHackathons, setPendingHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsData, registrationsData, hackathonsData] = await Promise.all([
          analyticsService.getDashboardStats().catch(() => null),
          registrationService.getRegistrations().catch(() => []),
          hackathonService.getAllHackathons().catch(() => [])
        ]);

        setAnalytics(analyticsData);

        // Enrich pending registrations with user and hackathon details
        const pendingRegsRaw = registrationsData.filter(r => r.status === 'pending');
        const enrichedPendingRegs = await Promise.all(pendingRegsRaw.map(async (reg) => {
          try {
            const userProfile = await userProfileService.getUserProfile(reg.userId);
            const hackathon = hackathonsData.find(h => h.id === reg.hackathonId);
            return {
              ...reg,
              userName: userProfile.user.name,
              userRoll: userProfile.user.rollNumber,
              hackathonTitle: hackathon ? hackathon.title : reg.hackathonId
            };
          } catch (e) {
            return reg;
          }
        }));

        setPendingRegistrations(enrichedPendingRegs);

        // Filter for pending hackathons only
        setPendingHackathons(hackathonsData.filter(h => h.status === 'pending'));
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
  const handleReviewHackathon = async (id: string, status: 'upcoming' | 'rejected') => {
    try {
      await hackathonService.reviewHackathon(id, status);
      setPendingHackathons(prev => prev.filter(h => h.id !== id));
      toast.success(`Competition ${status === 'upcoming' ? 'approved' : 'rejected'} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to review competition');
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
                    <h3 className="font-medium text-gray-900">{registration.userName || registration.userId}</h3>
                    <p className="text-sm text-gray-600">{registration.hackathonTitle || registration.hackathonId}</p>
                    <p className="text-xs text-gray-500">
                      {registration.teamName && `Team: ${registration.teamName} • `}
                      Priority: {registration.priority}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(registration.submittedAt)}
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

        {/* Competition Approval Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Competition Approval Requests</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pendingHackathons.length} pending
            </span>
          </div>
          <div className="space-y-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ) : pendingHackathons.length === 0 ? (
              <div className="text-center py-8">
                <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending competition requests</p>
              </div>
            ) : (
              pendingHackathons.map((hackathon) => {
                // Find the creator's registration if it exists in our list
                const creatorReg = pendingRegistrations.find(r => r.hackathonId === hackathon.id);

                return (
                  <div key={hackathon.id} className="p-5 bg-gray-50 border border-gray-100 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900">{hackathon.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{hackathon.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 bg-white text-xs text-gray-500 rounded border border-gray-200">
                            {formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}
                          </span>
                          <span className="px-2 py-1 bg-white text-xs text-gray-500 rounded border border-gray-200">
                            {hackathon.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReviewHackathon(hackathon.id, 'upcoming')}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                        >
                          Approve Competition
                        </button>
                        <button
                          onClick={() => handleReviewHackathon(hackathon.id, 'rejected')}
                          className="px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-50 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {creatorReg && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Creator Registration Details</h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">Team: {creatorReg.teamName || 'Individual'}</p>
                            <p className="text-xs text-gray-500">Student ID: {creatorReg.userId}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Registeration included</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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