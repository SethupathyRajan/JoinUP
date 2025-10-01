import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { hackathonService } from '../../services/hackathonService';
import { registrationService } from '../../services/registrationService';
import { Hackathon, Registration } from '../../types';
import toast from 'react-hot-toast';

export const CompetitionsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [competitions, setCompetitions] = useState<Hackathon[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hackathonsData, registrationsData] = await Promise.all([
          hackathonService.getAllHackathons(),
          registrationService.getRegistrations().catch(() => [])
        ]);
        
        setCompetitions(hackathonsData);
        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Error fetching competitions:', error);
        toast.error('Failed to load competitions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRegister = async (hackathonId: string) => {
    try {
      setRegistering(hackathonId);
      await registrationService.registerForHackathon({
        hackathonId,
        teamMembers: [currentUser!.id] // Single member team by default
      });
      
      // Refresh registrations
      const updatedRegistrations = await registrationService.getRegistrations();
      setRegistrations(updatedRegistrations);
      
      toast.success('Registration submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const filteredCompetitions = competitions
    .filter(comp => comp.status === activeTab)
    .filter(comp =>
      comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
          <p className="text-gray-600 mt-1">Discover and join exciting competitions</p>
        </div>
        {currentUser?.isAdmin && (
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
            <PlusIcon className="h-5 w-5" />
            <span>Create Competition</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          {['upcoming', 'ongoing', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompetitions.map((competition, index) => (
          <motion.div
            key={competition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{competition.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{competition.description}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(competition.status)}`}>
                  {competition.status}
                </span>
              </div>

              {/* Competition Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(competition.startDate)} - {formatDate(competition.endDate)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>Registration ends {formatDate(competition.registrationDeadline)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{competition.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4" />
                  <span>Team size: {competition.minTeamSize}-{competition.maxTeamSize}</span>
                </div>
              </div>

              {/* Prize Money */}
              <div className="flex items-center space-x-2 mb-4">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-bold text-gray-900">₹{competition.prizeMoney?.toLocaleString()}</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(competition.tags || []).map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Registration Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Registrations</span>
                  <span>{competition.registeredTeams || 0}/{competition.totalSlots || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${competition.registeredTeams && competition.totalSlots 
                        ? (competition.registeredTeams / competition.totalSlots) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              {(() => {
                const isRegistered = registrations.some(reg => reg.hackathonId === competition.id);
                const isLoading = registering === competition.id;
                const isExpired = new Date() > new Date(competition.registrationDeadline);
                
                if (isAdmin) {
                  return (
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium">
                      Manage Competition
                    </button>
                  );
                }
                
                if (isRegistered) {
                  return (
                    <button 
                      disabled
                      className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium cursor-not-allowed"
                    >
                      Already Registered
                    </button>
                  );
                }
                
                if (isExpired) {
                  return (
                    <button 
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Registration Closed
                    </button>
                  );
                }
                
                return (
                  <button 
                    onClick={() => handleRegister(competition.id)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Registering...' : 'Register Now'}
                  </button>
                );
              })()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCompetitions.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No competitions found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
        </div>
      )}
    </div>
  );
};