import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export const HistoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const participationHistory = [
    {
      id: '1',
      competition: 'Tech Hackathon 2024',
      registrationDate: new Date('2024-12-01'),
      eventDate: new Date('2024-12-15'),
      status: 'completed',
      result: 'Winner',
      team: 'Code Warriors',
      teamMembers: ['Alice Johnson', 'Bob Smith'],
      pointsEarned: 500,
      badges: ['Champion', 'Team Player'],
      certificates: ['winner-certificate.pdf'],
      projectLinks: ['https://github.com/team/project'],
      feedback: 'Excellent innovation and execution!'
    },
    {
      id: '2',
      competition: 'AI/ML Challenge',
      registrationDate: new Date('2024-11-15'),
      eventDate: new Date('2024-11-30'),
      status: 'completed',
      result: 'Participant',
      team: 'Data Scientists',
      teamMembers: ['Alice Johnson', 'Carol Davis', 'David Wilson'],
      pointsEarned: 200,
      badges: ['AI Explorer'],
      certificates: ['participation-certificate.pdf'],
      projectLinks: ['https://github.com/team/ml-project'],
      feedback: 'Good effort, keep exploring AI concepts!'
    },
    {
      id: '3',
      competition: 'Web Development Contest',
      registrationDate: new Date('2024-10-20'),
      eventDate: new Date('2024-11-05'),
      status: 'pending_approval',
      result: 'Pending Review',
      team: 'Web Masters',
      teamMembers: ['Alice Johnson'],
      pointsEarned: 0,
      badges: [],
      certificates: [],
      projectLinks: ['https://github.com/team/web-project'],
      feedback: ''
    },
    {
      id: '4',
      competition: 'Mobile App Challenge',
      registrationDate: new Date('2024-09-10'),
      eventDate: new Date('2024-09-25'),
      status: 'rejected',
      result: 'Not Selected',
      team: 'App Builders',
      teamMembers: ['Alice Johnson', 'Eva Martinez'],
      pointsEarned: 0,
      badges: [],
      certificates: [],
      projectLinks: [],
      feedback: 'Application did not meet minimum requirements.'
    }
  ];

  const filteredHistory = participationHistory.filter(item => {
    const matchesSearch = item.competition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.team.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending_approval': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Winner': return 'text-yellow-600 font-bold';
      case 'Runner-up': return 'text-orange-600 font-bold';
      case 'Participant': return 'text-blue-600';
      case 'Pending Review': return 'text-yellow-600';
      case 'Not Selected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    console.log('Exporting PDF...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Participation History</h1>
          <p className="text-gray-600 mt-1">Track your competition journey and achievements</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search competitions or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="this_year">This Year</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_3_months">Last 3 Months</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterDateRange('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participations</p>
              <p className="text-2xl font-bold text-gray-900">{participationHistory.length}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wins</p>
              <p className="text-2xl font-bold text-yellow-600">
                {participationHistory.filter(p => p.result === 'Winner').length}
              </p>
            </div>
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-green-600">
                {participationHistory.reduce((sum, p) => sum + p.pointsEarned, 0)}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((participationHistory.filter(p => p.status === 'completed').length / participationHistory.length) * 100)}%
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{item.competition}</h3>
                    <p className="text-gray-600">Team: {item.team}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Registered: {format(item.registrationDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Event: {format(item.eventDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <TrophyIcon className="h-4 w-4 text-gray-400" />
                    <span className={getResultColor(item.result)}>{item.result}</span>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Team Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.teamMembers.map((member, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Points and Badges */}
                {item.pointsEarned > 0 && (
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="font-medium text-green-600">+{item.pointsEarned} points</span>
                    </div>
                    {item.badges.length > 0 && (
                      <div className="flex space-x-1">
                        {item.badges.map((badge, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                {item.feedback && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700"><strong>Feedback:</strong> {item.feedback}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 min-w-0 lg:min-w-[120px]">
                {item.certificates.length > 0 && (
                  <button className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                    View Certificate
                  </button>
                )}
                {item.projectLinks.length > 0 && (
                  <button className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    View Project
                  </button>
                )}
                <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No participation history found</h3>
          <p className="text-gray-600">Start participating in competitions to build your history!</p>
        </div>
      )}
    </div>
  );
};