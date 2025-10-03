import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Trophy, Target, Calendar, Mail, Phone, GraduationCap, Hash, CreditCard as Edit3, Save, X, Lock, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { gamificationService } from '../../services/gamificationService';
import { registrationService } from '../../services/registrationService';
import { userProfileService } from '../../services/userProfileService';
import { GameStats, Registration, Achievement, Badge, User as UserType } from '../../types';
import { AchievementsSection } from './AchievementsSection';
import toast from 'react-hot-toast';

interface ProfileData {
  name: string;
  email: string;
  department: string;
  year: number;
  rollNumber: string;
  registerNumber: string;
  phoneNumber: string;
}

const ProfilePage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [viewedUser, setViewedUser] = useState<UserType | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const isViewingOwnProfile = !userId || userId === currentUser?.id;
  const displayUser = isViewingOwnProfile ? currentUser : viewedUser;
  const [profileData, setProfileData] = useState<ProfileData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    department: currentUser?.department || '',
    year: currentUser?.year || 1,
    rollNumber: currentUser?.rollNumber || '',
    registerNumber: currentUser?.registerNumber || '',
    phoneNumber: currentUser?.phoneNumber || ''
  });
  const [passwordVerification, setPasswordVerification] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfileData();
  }, [currentUser, userId]);

  const fetchProfileData = async () => {
    if (isAdmin && isViewingOwnProfile) {
      setLoading(false);
      return;
    }

    try {
      if (isViewingOwnProfile) {
        const [statsData, registrationsData, achievementsData, badgesData] = await Promise.all([
          gamificationService.getStats(),
          registrationService.getUserRegistrations(),
          gamificationService.getAchievements(),
          gamificationService.getBadges()
        ]);

        setGameStats(statsData);
        setRegistrations(registrationsData);
        setAchievements(achievementsData);
        setBadges(badgesData);
      } else {
        if (!userId) {
          setLoading(false);
          return;
        }

        const profileData = await userProfileService.getUserProfile(userId);
        setViewedUser(profileData.user);
        setGameStats(profileData.gameStats);
        setAchievements(profileData.achievements);
        setBadges(profileData.badges);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditMode(true);
    setProfileData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      department: currentUser?.department || '',
      year: currentUser?.year || 1,
      rollNumber: currentUser?.rollNumber || '',
      registerNumber: currentUser?.registerNumber || '',
      phoneNumber: currentUser?.phoneNumber || ''
    });
  };

  const handleSaveProfile = () => {
    // Check if any data has changed
    const hasChanges = (
      profileData.name !== currentUser?.name ||
      profileData.department !== currentUser?.department ||
      profileData.year !== currentUser?.year ||
      profileData.phoneNumber !== currentUser?.phoneNumber
    );

    if (!hasChanges) {
      setEditMode(false);
      toast.success('No changes to save');
      return;
    }

    // Show password verification modal
    setShowPasswordModal(true);
  };

  const verifyPasswordAndSave = async () => {
    if (!passwordVerification) {
      toast.error('Please enter your password to verify changes');
      return;
    }

    try {
      // Call API to verify password and update profile
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          ...profileData,
          password: passwordVerification
        })
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setEditMode(false);
        setShowPasswordModal(false);
        setPasswordVerification('');
        // Refresh user data here
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Password changed successfully!');
        setChangePasswordMode(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    }
  };

  const getLevelName = (level: number) => {
    const levels = [
      'Newcomer', 'Explorer', 'Competitor', 'Champion', 'Expert', 
      'Master', 'Legend', 'Elite', 'Grandmaster', 'Hall of Fame'
    ];
    return levels[level - 1] || 'Newcomer';
  };

  const getNextLevelPoints = (points: number) => {
    const levelThresholds = [0, 500, 1000, 2000, 3500, 5500, 8000, 11500, 16000, 22000];
    for (let i = 0; i < levelThresholds.length; i++) {
      if (points < levelThresholds[i]) {
        return levelThresholds[i] - points;
      }
    }
    return 0; // Max level reached
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Admin users get a simplified profile view
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
              <div className="flex items-center">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-600" />
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-white">{currentUser?.name}</h1>
                  <p className="text-blue-100">Administrator</p>
                  <p className="text-blue-100">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">{currentUser?.email}</span>
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">{currentUser?.department || 'Administration'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setChangePasswordMode(true)}
                      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Change Password Modal for Admin */}
          {changePasswordMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <button
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Student profile view with full gamification features
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isViewingOwnProfile && (
          <button
            onClick={() => navigate('/leaderboard')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leaderboard
          </button>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-600" />
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-white">{displayUser?.name}</h1>
                  <p className="text-blue-100">{displayUser?.email}</p>
                  {gameStats && (
                    <div className="mt-2">
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                        Level {gameStats.level} - {getLevelName(gameStats.level)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {isViewingOwnProfile && (
                <button
                  onClick={editMode ? handleSaveProfile : handleEditProfile}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
                >
                  {editMode ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {gameStats && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{gameStats.points} points</span>
                <span>{getNextLevelPoints(gameStats.points)} to next level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((gameStats.points % 1000) / 1000) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                {editMode && isViewingOwnProfile ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{displayUser?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{displayUser?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                {editMode && isViewingOwnProfile ? (
                  <select
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                    <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                  </select>
                ) : (
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">{displayUser?.department}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                {editMode && isViewingOwnProfile ? (
                  <select
                    value={profileData.year}
                    onChange={(e) => setProfileData({ ...profileData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                ) : (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">{displayUser?.year}st Year</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <div className="flex items-center text-gray-500">
                  <Hash className="h-4 w-4 mr-2" />
                  <span>{displayUser?.rollNumber}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Register Number</label>
                <div className="flex items-center text-gray-500">
                  <Hash className="h-4 w-4 mr-2" />
                  <span>{displayUser?.registerNumber}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {editMode && isViewingOwnProfile ? (
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">{displayUser?.phoneNumber || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </motion.div>

          {/* Stats Cards */}
          <div className="space-y-6">
            {gameStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Game Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Points</span>
                    <span className="font-semibold text-blue-600">{gameStats.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Level</span>
                    <span className="font-semibold text-purple-600">{gameStats.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participations</span>
                    <span className="font-semibold text-green-600">{gameStats.totalParticipations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Wins</span>
                    <span className="font-semibold text-red-500">{gameStats.totalWins}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isViewingOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  Competition Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered</span>
                    <span className="font-semibold text-blue-600">{registrations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">
                      {registrations.filter(r => r.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {registrations.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {isViewingOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-gray-500" />
                  Account Settings
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setChangePasswordMode(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <AchievementsSection achievements={achievements} badges={badges} />
        </motion.div>

        {/* Password Verification Modal */}
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Verify Your Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordVerification('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Please enter your current password to confirm these changes to your profile.
              </p>

              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordVerification}
                  onChange={(e) => setPasswordVerification(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={verifyPasswordAndSave}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Verify & Save
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordVerification('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Change Password Modal */}
        {changePasswordMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <button
                  onClick={() => {
                    setChangePasswordMode(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
                <button
                  onClick={() => {
                    setChangePasswordMode(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
