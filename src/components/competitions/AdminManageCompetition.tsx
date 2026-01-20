import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registrationService } from '../../services/registrationService';
import { hackathonService } from '../../services/hackathonService';
import { Hackathon } from '../../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PaperClipIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const AdminManageCompetition: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regs, hack] = await Promise.all([
        registrationService.getRegistrationsFiltered({ hackathonId: id }),
        hackathonService.getHackathon(id || '')
      ]);
      setRegistrations(regs);
      setHackathon(hack);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const openRegistration = (reg: any) => {
    setSelected(reg);
    setFeedback(reg.feedback || '');
  };

  const closeDetails = () => {
    setSelected(null);
    setFeedback('');
  };

  const handleDecision = async (status: 'approved' | 'rejected' | 'waitlisted') => {
    if (!selected) return;
    try {
      await registrationService.updateRegistrationStatus(selected.id, status, feedback || undefined);
      toast.success(`Registration ${status} successfully!`);
      await fetchData();
      closeDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update status');
    }
  };

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
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'waitlisted': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      (reg.teamName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.userId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (reg.teamMembers?.some((m: any) => 
        (typeof m === 'string' ? false : (m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase())))
      ));
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
    waitlisted: registrations.filter(r => r.status === 'waitlisted').length,
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/competitions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Registrations</h1>
            {hackathon && (
              <p className="text-gray-600 mt-1">{hackathon.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Waitlisted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.waitlisted}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by team name, leader, or member..."
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

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registrations List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Registrations ({filteredRegistrations.length})
            </h2>
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No registrations found</p>
                </div>
              ) : (
                filteredRegistrations.map((reg) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => openRegistration(reg)}
                    className={`p-4 bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selected?.id === reg.id
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {reg.teamName || 'Individual Registration'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(toDate(reg.submittedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {getStatusIcon(reg.status)}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                      {reg.teamMembers && reg.teamMembers.length > 0 && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {reg.teamMembers.length} member{reg.teamMembers.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Registration Details */}
          <div className="lg:col-span-2">
            {selected ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
                  <button
                    onClick={closeDetails}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(selected.status)}`}>
                    {getStatusIcon(selected.status)}
                    <span className="font-medium capitalize">{selected.status}</span>
                  </div>
                </div>

                {/* Team Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      Team Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Team Name</label>
                        <p className="text-gray-900 font-medium">{selected.teamName || 'Individual Registration'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Registration Date</label>
                        <p className="text-gray-900">{format(toDate(selected.submittedAt), 'MMMM dd, yyyy HH:mm')}</p>
                      </div>
                      {selected.reviewedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Reviewed Date</label>
                          <p className="text-gray-900">{format(toDate(selected.reviewedAt), 'MMMM dd, yyyy HH:mm')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  {selected.teamMembers && selected.teamMembers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        Team Members ({selected.teamMembers.length})
                      </h3>
                      <div className="space-y-3">
                        {selected.teamMembers.map((member: any, idx: number) => {
                          const memberData = typeof member === 'string' 
                            ? { id: member, name: 'Unknown', email: member }
                            : member;
                          return (
                            <div key={memberData.id || idx} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{memberData.name || 'Unknown'}</p>
                                  <div className="mt-1 space-y-1">
                                    {memberData.email && (
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                                        {memberData.email}
                                      </p>
                                    )}
                                    {(memberData.rollNumber || memberData.registerNumber) && (
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                                        {memberData.rollNumber || memberData.registerNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {selected.userId === memberData.id && (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Leader
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {(selected.note || selected.gformLink || (selected.bonafideFiles && selected.bonafideFiles.length > 0)) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Additional Information
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selected.note && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Notes</label>
                            <p className="text-gray-900 mt-1">{selected.note}</p>
                          </div>
                        )}
                        {selected.gformLink && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Google Form</label>
                            <a
                              href={selected.gformLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center mt-1"
                            >
                              <LinkIcon className="h-4 w-4 mr-1" />
                              Open Form
                            </a>
                          </div>
                        )}
                        {selected.bonafideFiles && selected.bonafideFiles.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Bonafide Files</label>
                            <div className="space-y-2">
                              {selected.bonafideFiles.map((file: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={`https://drive.google.com/file/d/${file.googleDriveFileId}/view`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <PaperClipIcon className="h-4 w-4 mr-2" />
                                  {file.originalName}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h3>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add feedback for this registration (optional)..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDecision('approved')}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDecision('waitlisted')}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      <ClockIcon className="h-5 w-5" />
                      <span>Waitlist</span>
                    </button>
                    <button
                      onClick={() => handleDecision('rejected')}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Registration</h3>
                <p className="text-gray-600">Choose a registration from the list to view details and take action</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageCompetition;
