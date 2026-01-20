import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  LinkIcon,
  CalendarIcon,
  UsersIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { hackathonService } from '../../services/hackathonService';
import { registrationService } from '../../services/registrationService';
import { apiRequest, API_CONFIG } from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const RegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [hackathon, setHackathon] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [registerSearch, setRegisterSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [bonafideFile, setBonafideFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const h = await hackathonService.getHackathon(id);
        if (!h) {
          setNotFound(true);
          return;
        }
        setHackathon(h);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load event');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!query.trim()) {
            setSearchResults([]);
            return;
          }
          try {
            setSearching(true);
            const res = await apiRequest(
              API_CONFIG.ENDPOINTS.USER.SEARCH + `?query=${encodeURIComponent(query.trim())}`,
              {},
              true
            );
            setSearchResults(res.data?.users || []);
          } catch (err) {
            console.error('User search failed:', err);
            setSearchResults([]);
          } finally {
            setSearching(false);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(registerSearch);
  }, [registerSearch, debouncedSearch]);

  const addMember = (user: any) => {
    // Check if already selected
    if (selectedMembers.find(m => m.id === user.id)) {
      toast.error('Member already added');
      return;
    }

    // Check if it's the current user
    if (user.id === currentUser?.id) {
      toast.error('You are automatically included as team leader');
      return;
    }

    // Check team size limit
    if (hackathon && selectedMembers.length >= hackathon.maxTeamSize - 1) {
      toast.error(`Maximum team size is ${hackathon.maxTeamSize}`);
      return;
    }

    setSelectedMembers(prev => [...prev, user]);
    setRegisterSearch('');
    setSearchResults([]);
    toast.success(`${user.name} added to team`);
  };

  const removeMember = (id: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== id));
    toast.success('Member removed');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setBonafideFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setBonafideFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async () => {
    if (!hackathon) return;

    // Validation
    if (hackathon.minTeamSize > 1 && selectedMembers.length < hackathon.minTeamSize - 1) {
      toast.error(`Minimum team size is ${hackathon.minTeamSize}. Please add more members.`);
      return;
    }

    setSubmitting(true);
    try {
      let uploadedFiles: any[] = [];
      if (bonafideFile) {
        const form = new FormData();
        form.append('certificates', bonafideFile);
        form.append('hackathonId', hackathon.id);

        // Use apiRequest helper which handles token and base URL correctly
        const uploadData = await apiRequest(`${API_CONFIG.BASE_URL}/upload/certificates`, {
          method: 'POST',
          body: form
        }, true);

        uploadedFiles = uploadData.data.uploadedFiles || [];
      }

      const payload = {
        hackathonId: hackathon.id,
        teamName: teamName || undefined,
        teamMembers: selectedMembers.map(m => m.id),
        bonafideFiles: uploadedFiles,
        note: note || undefined,
      };

      await registrationService.registerForHackathon(payload);
      toast.success('Registration submitted successfully!');
      navigate('/competitions');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <p className="text-gray-600 mb-4">The event you are trying to register for does not exist or may have been removed.</p>
          <button
            onClick={() => navigate('/competitions')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  if (!hackathon) return null;

  const totalTeamSize = selectedMembers.length + 1; // +1 for current user (leader)

  // Helper function to safely convert to Date
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hackathon.title}</h1>
              <p className="text-blue-100">{hackathon.description}</p>
            </div>
            <TrophyIcon className="h-12 w-12 text-white opacity-80" />
          </div>
        </motion.div>

        {/* Competition Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Competition Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-5 w-5" />
              <span className="text-sm">
                {format(toDate(hackathon.startDate), 'MMM dd, yyyy')} - {format(toDate(hackathon.endDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <UsersIcon className="h-5 w-5" />
              <span className="text-sm">
                Team Size: {hackathon.minTeamSize} - {hackathon.maxTeamSize} members
              </span>
            </div>
            {hackathon.prizeMoney && (
              <div className="flex items-center space-x-2 text-gray-600">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Prize: ₹{hackathon.prizeMoney.toLocaleString()}</span>
              </div>
            )}
            {hackathon.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <span className="text-sm">📍 {hackathon.location}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900">Registration Form</h2>

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty for individual registration</p>
          </div>

          {/* Team Members Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members <span className="text-gray-400">({totalTeamSize}/{hackathon.maxTeamSize})</span>
            </label>

            {/* Current User (Leader) */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{currentUser?.name} (You)</div>
                    <div className="text-sm text-gray-500">{currentUser?.registerNumber} • Team Leader</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Leader</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={registerSearch}
                onChange={(e) => setRegisterSearch(e.target.value)}
                placeholder="Search by Register Number, Roll Number, or Email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((user) => {
                      const isSelected = selectedMembers.some(m => m.id === user.id);
                      const isCurrentUser = user.id === currentUser?.id;

                      return (
                        <div
                          key={user.id}
                          className={`p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${isSelected || isCurrentUser ? 'opacity-50' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">
                                  {user.registerNumber} • {user.rollNumber} • {user.email}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => addMember(user)}
                              disabled={isSelected || isCurrentUser}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${isSelected || isCurrentUser
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                                }`}
                            >
                              {isSelected ? 'Added' : isCurrentUser ? 'You' : 'Add'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Members ({selectedMembers.length})</h3>
                <div className="space-y-2">
                  {selectedMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.registerNumber}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Size Info */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Team Size:</strong> {totalTeamSize} / {hackathon.maxTeamSize} members
                {hackathon.minTeamSize > 1 && totalTeamSize < hackathon.minTeamSize && (
                  <span className="text-red-600 ml-2">(Minimum {hackathon.minTeamSize} required)</span>
                )}
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentArrowUpIcon className="h-5 w-5 inline mr-1" />
              Bonafide / On-duty Certificate <span className="text-gray-400">(Optional)</span>
            </label>
            {!bonafideFile ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900">{bonafideFile.name}</div>
                      <div className="text-sm text-gray-500">{(bonafideFile.size / 1024).toFixed(2)} KB</div>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {filePreview && (
                  <div className="mt-3">
                    <img src={filePreview} alt="Preview" className="max-w-full h-32 object-contain rounded" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="h-5 w-5 inline mr-1" />
              Additional Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Any additional information or special requests..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Google Form Link */}
          {hackathon.gformLink && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <LinkIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-900 mb-1">External Registration Required</h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    Please complete the Google Form registration as well:
                  </p>
                  <a
                    href={hackathon.gformLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
                  >
                    Open Registration Form
                    <LinkIcon className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/competitions')}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (hackathon.minTeamSize > 1 && totalTeamSize < hackathon.minTeamSize)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
