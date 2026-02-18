import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { userProfileService } from '../../services/userProfileService';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils/dateUtils';
import { registrationService } from '../../services/registrationService';
import { hackathonService } from '../../services/hackathonService';
import { Registration } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { generateParticipationReport } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

interface HistoryItem extends Registration {
  hackathonTitle?: string;
}

export const HistoryPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [participationHistory, setParticipationHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Admin Search State
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Helper function to convert Firestore timestamp to Date
  const toDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date();
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await registrationService.getRegistrations();

        // Convert Firestore timestamps and fetch hackathon details
        const enrichedData = await Promise.all(
          data.map(async (item: any) => {
            const historyItem: HistoryItem = {
              ...item,
              submittedAt: toDate(item.submittedAt),
              reviewedAt: item.reviewedAt ? toDate(item.reviewedAt) : undefined,
            };

            // Fetch hackathon title
            try {
              const hackathon = await hackathonService.getHackathon(item.hackathonId);
              historyItem.hackathonTitle = hackathon.title;
            } catch (err) {
              console.warn(`Failed to fetch hackathon ${item.hackathonId}:`, err);
              historyItem.hackathonTitle = item.hackathonId;
            }

            return historyItem;
          })
        );

        setParticipationHistory(enrichedData);
      } catch (error) {
        console.error('Error fetching participation history:', error);
        toast.error('Failed to load participation history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDownloadCertificate = async (registrationId: string) => {
    try {
      const blob = await registrationService.downloadCertificate(registrationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${registrationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download certificate');
    }
  };

  const filteredHistory = participationHistory.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (item.hackathonTitle?.toLowerCase().includes(searchLower)) ||
      (item.hackathonId.toLowerCase().includes(searchLower)) ||
      (item.teamName?.toLowerCase().includes(searchLower));

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const now = new Date();
      const itemDate = item.submittedAt;

      switch (filterDateRange) {
        case 'this_year':
          matchesDate = itemDate.getFullYear() === now.getFullYear();
          break;
        case 'last_6_months':
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          matchesDate = itemDate >= sixMonthsAgo;
          break;
        case 'last_3_months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          matchesDate = itemDate >= threeMonthsAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'waitlisted': return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const handleExportPDF = async () => {
    if (!currentUser) {
      toast.error('Please login to export your participation report');
      return;
    }

    if (participationHistory.length === 0) {
      toast.error('No participation history to export');
      return;
    }

    try {
      setExportingPDF(true);
      toast.loading('Generating PDF report...', { id: 'pdf-export' });

      // Calculate statistics
      const stats = {
        totalParticipations: participationHistory.length,
        approved: participationHistory.filter(r => r.status === 'approved').length,
        pending: participationHistory.filter(r => r.status === 'pending').length,
        rejected: participationHistory.filter(r => r.status === 'rejected').length,
        successRate: participationHistory.length > 0
          ? Math.round((participationHistory.filter(r => r.status === 'approved').length / participationHistory.length) * 100)
          : 0
      };

      // Prepare user data
      const userData = {
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
        year: currentUser.year,
        rollNumber: currentUser.rollNumber
      };

      // Generate PDF
      await generateParticipationReport({
        user: userData,
        registrations: participationHistory,
        stats
      });

      toast.success('PDF report generated successfully!', { id: 'pdf-export' });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF report', { id: 'pdf-export' });
    } finally {
      setExportingPDF(false);
    }
  };



  // Admin Search Functions
  const handleAdminSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSearchQuery.trim()) return;

    try {
      setIsSearching(true);
      const results = await userProfileService.searchUsers(adminSearchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.error('No students found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search students');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setSearchResults([]); // Clear results to show selected view
    setAdminSearchQuery('');

    try {
      setLoading(true);
      // Fetch selected student's history
      const participations = await userProfileService.getUserParticipations(student.id);

      // Transform data similar to fetchHistory
      const enrichedHistory = await Promise.all(
        participations.map(async (item: any) => {
          const historyItem: HistoryItem = {
            ...item,
            submittedAt: toDate(item.submittedAt),
            reviewedAt: item.reviewedAt ? toDate(item.reviewedAt) : undefined,
          };

          try {
            const hackathon = await hackathonService.getHackathon(item.hackathonId);
            historyItem.hackathonTitle = hackathon.title;
          } catch (err) {
            historyItem.hackathonTitle = item.hackathonId;
          }

          return historyItem;
        })
      );

      setParticipationHistory(enrichedHistory);
    } catch (error) {
      console.error('Error fetching student history:', error);
      toast.error('Failed to load student history');
    } finally {
      setLoading(false);
    }
  };

  const clearSelectedStudent = () => {
    setSelectedStudent(null);
    setParticipationHistory([]); // Or reset to empty
    // If admin wants to see their own history, they can't easily switch back in this view 
    // unless we strictly separate "My History" vs "Student History" tabs.
    // For now, let's just clear the view.
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Student Records & History' : 'Participation History'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Search and manage student participation records'
              : 'Track your competition journey and achievements'}
          </p>
        </div>
        {(participationHistory.length > 0 || selectedStudent) && (
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF || participationHistory.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>{exportingPDF ? 'Generating...' : 'Export Record PDF'}</span>
          </button>
        )}
      </div>

      {/* Admin Search Section */}
      {isAdmin && !selectedStudent && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Find a Student</h2>
          <form onSubmit={handleAdminSearch} className="flex gap-4">
            <div className="relative flex-1">
              <UserIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder="Search by name, roll number, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border border-gray-100 rounded-lg max-h-60 overflow-y-auto">
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.rollNumber} • {student.department}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Student Banner */}
      {selectedStudent && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
              {selectedStudent.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Viewing Records: {selectedStudent.name}</h3>
              <p className="text-sm text-blue-700">{selectedStudent.email} • {selectedStudent.rollNumber}</p>
            </div>
          </div>
          <button
            onClick={clearSelectedStudent}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Search Another Student
          </button>
        </div>
      )}

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
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
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
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {participationHistory.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {participationHistory.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {participationHistory.length > 0 ? Math.round((participationHistory.filter(p => p.status === 'approved').length / participationHistory.length) * 100) : 0}%
                </p>
              </div>
              <TrophyIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          filteredHistory.map((item, index) => (
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
                      <h3 className="text-xl font-bold text-gray-900">{item.hackathonTitle || item.hackathonId}</h3>
                      {item.teamName && <p className="text-gray-600">Team: {item.teamName}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Registered: {formatDate(item.submittedAt)}</span>
                    </div>
                    {item.reviewedAt && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Reviewed: {formatDate(item.reviewedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  {item.teamMembers && item.teamMembers.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">Team Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.teamMembers.map((member: any, idx: number) => {
                          const memberName = typeof member === 'string'
                            ? `Member ${idx + 1}`
                            : (member.name || member.email || `Member ${idx + 1}`);
                          const memberRoll = typeof member === 'object' ? (member.rollNumber || member.registerNumber) : null;
                          return (
                            <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                              {memberName}{memberRoll ? ` (${memberRoll})` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                      {item.priority} priority
                    </span>
                  </div>

                  {/* Feedback */}
                  {item.feedback && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700"><strong>Feedback:</strong> {item.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 min-w-0 lg:min-w-[120px]">
                  {item.status === 'approved' && (
                    <button
                      onClick={() => handleDownloadCertificate(item.id)}
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Download Certificate
                    </button>
                  )}
                  <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
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