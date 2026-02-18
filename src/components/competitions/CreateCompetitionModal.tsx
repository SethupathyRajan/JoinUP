import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, TrashIcon, CloudArrowUpIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { userProfileService } from '../../services/userProfileService';
import { hackathonService } from '../../services/hackathonService';
import { Hackathon } from '../../types';
import toast from 'react-hot-toast';

interface CreateCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  'Web Development',
  'AI/ML',
  'Mobile Development',
  'Cyber Security',
  'Data Science',
  'IoT',
  'Blockchain',
  'Game Development',
  'Design',
  'General'
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const COMMON_TAGS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'Java', 'C++', 'Machine Learning',
  'Deep Learning', 'Mobile', 'Web', 'Full Stack', 'Backend', 'Frontend',
  'DevOps', 'Cloud', 'Security', 'Blockchain', 'IoT', 'AR/VR', 'UI/UX'
];

export const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    minTeamSize: 1,
    maxTeamSize: 5,
    prizeMoney: '',
    location: '',
    category: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    tags: [] as string[],
    requirements: [] as string[],
    gformLink: '',
    totalSlots: 100,
    teamName: '' // For hybrid registration
  });

  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [loading, setLoading] = useState(false);

  // New state for team members and brochure
  const [teamMembers, setTeamMembers] = useState<{ name: string, role: string, email?: string, userId?: string, rollNumber?: string }[]>([]);
  const [newMember, setNewMember] = useState({ name: '', role: 'Member', email: '' });
  const [brochureFile, setBrochureFile] = useState<File | null>(null);

  // Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearchMembers = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearchingMembers(true);
      const results = await userProfileService.searchUsers(query);
      // Filter out already added members
      setSearchResults(results.filter((u: any) => !teamMembers.some(m => m.userId === u.id)));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleAddMember = (user: any) => {
    setTeamMembers([...teamMembers, {
      name: user.name,
      role: 'Member',
      email: user.email,
      userId: user.id,
      rollNumber: user.rollNumber
    }]);
    setMemberSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveMember = (idx: number) => {
    const newMembers = [...teamMembers];
    newMembers.splice(idx, 1);
    setTeamMembers(newMembers);
  };

  const handleBrochureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBrochureFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'minTeamSize' || name === 'maxTeamSize' || name === 'totalSlots'
        ? parseInt(value) || 0
        : name === 'prizeMoney'
          ? value
          : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim() && !formData.requirements.includes(requirementInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== req)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!(formData as any).teamName?.trim()) {
      toast.error('Team Name is required for registration');
      return false;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return false;
    }
    if (!formData.startDate || !formData.endDate || !formData.registrationDeadline) {
      toast.error('All dates are required');
      return false;
    }
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const regDeadline = new Date(formData.registrationDeadline);
    const now = new Date();

    if (regDeadline >= startDate) {
      toast.error('Registration deadline must be before start date');
      return false;
    }
    if (startDate >= endDate) {
      toast.error('End date must be after start date');
      return false;
    }
    if (regDeadline < now) {
      toast.error('Registration deadline must be in the future');
      return false;
    }
    if (formData.minTeamSize > formData.maxTeamSize) {
      toast.error('Min team size cannot be greater than max team size');
      return false;
    }
    if (formData.tags.length === 0) {
      toast.error('At least one tag is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const competitionData: Partial<Hackathon> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: new Date(formData.registrationDeadline),
        minTeamSize: formData.minTeamSize,
        maxTeamSize: formData.maxTeamSize,
        tags: formData.tags,
        category: formData.category,
        difficulty: formData.difficulty,
        status: 'upcoming',
        location: formData.location.trim() || 'Online',
        prizeMoney: formData.prizeMoney ? parseFloat(formData.prizeMoney) : undefined,
        requirements: formData.requirements.length > 0 ? formData.requirements : undefined,
        ...(formData.gformLink && { gformLink: formData.gformLink.trim() }),
        ...(formData.totalSlots && { totalSlots: formData.totalSlots }),
        registrationDetails: {
          teamName: formData.teamName.trim(),
          teamMembers: teamMembers, // Include added members
          brochure: brochureFile ? { name: brochureFile.name, size: brochureFile.size } : null // Placeholder for file logic
        }
      } as any;

      await hackathonService.createHackathon(competitionData);
      toast.success('Competition created successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        minTeamSize: 1,
        maxTeamSize: 5,
        prizeMoney: '',
        location: '',
        category: '',
        difficulty: 'intermediate',
        tags: [],
        requirements: [],
        gformLink: '',
        totalSlots: 100,
        teamName: ''
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating competition:', error);
      toast.error(error.message || 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Create New Competition</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title and Description */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Registration Details Section for Students */}
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Your Team Registration</h3>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Required</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">
                        Participating Team Name <span className="text-blue-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="teamName"
                        value={(formData as any).teamName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Enter the team name you are participating with"
                        required
                      />
                      <p className="text-xs text-blue-600 mt-1">You will be automatically registered as the leader of this team.</p>
                    </div>

                    {/* Team Members Input */}
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">Team Members (Optional)</label>
                      <div className="space-y-2">
                        {teamMembers.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-blue-100/50 p-2 rounded border border-blue-200">
                            <span className="text-sm font-medium text-blue-900 flex-1">{member.name} ({member.email})</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{member.role}</span>
                            <button type="button" onClick={() => handleRemoveMember(idx)} className="text-red-500 hover:text-red-700">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Search Input */}
                      <div className="relative mt-2">
                        <div className="relative">
                          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by name or roll number..."
                            value={memberSearchQuery}
                            onChange={(e) => handleSearchMembers(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {isSearchingMembers && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleAddMember(user)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.rollNumber} • {user.department}</p>
                                </div>
                                <PlusIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                              </button>
                            ))}
                          </div>
                        )}

                        {memberSearchQuery.length >= 2 && searchResults.length === 0 && !isSearchingMembers && (
                          <div className="text-xs text-gray-500 mt-1 ml-1">No users found</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Competition Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Tech Hackathon 2024"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the competition, objectives, and what participants will build..."
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleInputChange}
                      min={getMinDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={formData.registrationDeadline || getMinDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || getMinDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Team Size and Location */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Team Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="minTeamSize"
                      value={formData.minTeamSize}
                      onChange={handleInputChange}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Team Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="maxTeamSize"
                      value={formData.maxTeamSize}
                      onChange={handleInputChange}
                      min={formData.minTeamSize}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Slots
                    </label>
                    <input
                      type="number"
                      name="totalSlots"
                      value={formData.totalSlots}
                      onChange={handleInputChange}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Online or Physical location"
                    />
                  </div>
                </div>

                {/* Category and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {DIFFICULTY_LEVELS.map(level => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prize Money and Google Form Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prize Money (₹)
                    </label>
                    <input
                      type="number"
                      name="prizeMoney"
                      value={formData.prizeMoney}
                      onChange={handleInputChange}
                      min={0}
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Google Form Link (Optional)
                    </label>
                    <input
                      type="url"
                      name="gformLink"
                      value={formData.gformLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://forms.google.com/..."
                    />
                  </div>
                </div>

                {/* Brochure Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Brochure (Optional)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudArrowUpIcon className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input type="file" className="hidden" onChange={handleBrochureChange} accept=".pdf,.jpg,.jpeg,.png" />
                    </label>
                  </div>
                  {brochureFile && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg">
                      <span className="text-sm text-green-700 font-medium truncate max-w-xs">{brochureFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setBrochureFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COMMON_TAGS.filter(tag => !formData.tags.includes(tag)).slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!formData.tags.includes(tag)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements (Optional)
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          {req}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(req)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a requirement and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Competition'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
