import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrophyIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  StarIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const stats = [
    {
      title: 'Total Points',
      value: currentUser?.gameStats.points || 0,
      icon: StarIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Current Level',
      value: currentUser?.gameStats.level || 1,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Participations',
      value: currentUser?.gameStats.totalParticipations || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Streak',
      value: currentUser?.gameStats.streaks.hackathon || 0,
      icon: FireIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    }
  ];

  const recentActivities = [
    { title: 'Registered for Tech Hackathon 2024', time: '2 hours ago', type: 'registration' },
    { title: 'Earned "First Timer" badge', time: '1 day ago', type: 'achievement' },
    { title: 'Submitted project for AI Challenge', time: '3 days ago', type: 'submission' }
  ];

  const upcomingEvents = [
    { title: 'Tech Hackathon 2024', date: 'Jan 15, 2025', status: 'registered' },
    { title: 'AI/ML Challenge', date: 'Jan 22, 2025', status: 'open' },
    { title: 'Web Dev Contest', date: 'Feb 5, 2025', status: 'open' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-orange-400 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {currentUser?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-blue-100">
          Ready to join your next competition? Let's make it count!
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {event.date}
                </p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                  event.status === 'registered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {event.status === 'registered' ? 'Registered' : 'Open'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <TrophyIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Browse Competitions</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">View Leaderboard</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <StarIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Check Achievements</span>
          </button>
        </div>
      </div>
    </div>
  );
};