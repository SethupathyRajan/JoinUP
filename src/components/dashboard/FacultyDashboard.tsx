import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UsersIcon,
  TrophyIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const stats = [
    {
      title: 'Total Students',
      value: '1,234',
      icon: UsersIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      change: '+12%'
    },
    {
      title: 'Active Competitions',
      value: '8',
      icon: TrophyIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      change: '+2'
    },
    {
      title: 'Pending Approvals',
      value: '23',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      change: '-5'
    },
    {
      title: 'Total Registrations',
      value: '456',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      change: '+18%'
    }
  ];

  const pendingApprovals = [
    { student: 'Alice Johnson', competition: 'Tech Hackathon 2024', department: 'CSE', submitted: '2 hours ago' },
    { student: 'Bob Smith', competition: 'AI Challenge', department: 'IT', submitted: '4 hours ago' },
    { student: 'Carol Davis', competition: 'Web Dev Contest', department: 'CSE', submitted: '1 day ago' }
  ];

  const recentActivity = [
    { action: 'Created new competition "Data Science Challenge"', time: '1 hour ago' },
    { action: 'Approved 15 student registrations', time: '3 hours ago' },
    { action: 'Updated "Tech Hackathon 2024" details', time: '1 day ago' }
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
              {pendingApprovals.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {pendingApprovals.map((approval, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{approval.student}</h3>
                  <p className="text-sm text-gray-600">{approval.competition}</p>
                  <p className="text-xs text-gray-500">{approval.department} • {approval.submitted}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200">
                    Approve
                  </button>
                  <button className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
            <PlusIcon className="h-5 w-5" />
            <span className="font-medium">Create Competition</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Review Approvals</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">View Analytics</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <UsersIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Manage Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};