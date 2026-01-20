import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon, TrashIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { registrationService } from '../../services/registrationService';
import { submissionService } from '../../services/submissionService';
import { Registration, CompetitionAchievement } from '../../types';
import toast from 'react-hot-toast';

interface CreateSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedRegistrationId?: string;
}

const ACHIEVEMENT_TYPES: Array<{
    type: CompetitionAchievement['type'];
    label: string;
    points: number;
}> = [
        { type: 'winner', label: 'Winner', points: 500 },
        { type: 'runner_up', label: 'Runner Up', points: 350 },
        { type: 'third_place', label: 'Third Place', points: 250 },
        { type: 'top_10', label: 'Top 10', points: 150 },
        { type: 'participation', label: 'Participation', points: 100 },
        { type: 'special_recognition', label: 'Special Recognition', points: 200 },
    ];

export const CreateSubmissionModal: React.FC<CreateSubmissionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    preselectedRegistrationId,
}) => {
    const [approvedRegistrations, setApprovedRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRegistrations, setLoadingRegistrations] = useState(true);

    const [formData, setFormData] = useState({
        registrationId: preselectedRegistrationId || '',
        hackathonId: '',
        description: '',
        repoUrl: '',
        demoUrl: '',
        projectLinks: [''] as string[],
        achievements: [] as CompetitionAchievement[],
    });

    const [certificates, setCertificates] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchApprovedRegistrations();
        }
    }, [isOpen]);

    useEffect(() => {
        if (preselectedRegistrationId) {
            setFormData((prev) => ({ ...prev, registrationId: preselectedRegistrationId }));
        }
    }, [preselectedRegistrationId]);

    const fetchApprovedRegistrations = async () => {
        try {
            setLoadingRegistrations(true);
            const data = await registrationService.getRegistrations();
            const approved = data.filter((r) => r.status === 'approved');
            setApprovedRegistrations(approved);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            toast.error('Failed to load registrations');
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleRegistrationChange = (registrationId: string) => {
        const registration = approvedRegistrations.find((r) => r.id === registrationId);
        setFormData({
            ...formData,
            registrationId,
            hackathonId: registration?.hackathonId || '',
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (certificates.length + newFiles.length > 5) {
                toast.error('Maximum 5 certificates allowed');
                return;
            }
            setCertificates([...certificates, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setCertificates(certificates.filter((_, i) => i !== index));
    };

    const addProjectLink = () => {
        setFormData({
            ...formData,
            projectLinks: [...formData.projectLinks, ''],
        });
    };

    const updateProjectLink = (index: number, value: string) => {
        const newLinks = [...formData.projectLinks];
        newLinks[index] = value;
        setFormData({ ...formData, projectLinks: newLinks });
    };

    const removeProjectLink = (index: number) => {
        setFormData({
            ...formData,
            projectLinks: formData.projectLinks.filter((_, i) => i !== index),
        });
    };

    const addAchievement = (type: CompetitionAchievement['type']) => {
        const achievementType = ACHIEVEMENT_TYPES.find((a) => a.type === type);
        if (!achievementType) return;

        const newAchievement: CompetitionAchievement = {
            type,
            title: achievementType.label,
            points: achievementType.points,
        };

        setFormData({
            ...formData,
            achievements: [...formData.achievements, newAchievement],
        });
    };

    const removeAchievement = (index: number) => {
        setFormData({
            ...formData,
            achievements: formData.achievements.filter((_, i) => i !== index),
        });
    };

    const validateForm = (): boolean => {
        if (!formData.registrationId) {
            toast.error('Please select a registration');
            return false;
        }
        if (!formData.description.trim()) {
            toast.error('Please provide a description');
            return false;
        }
        if (formData.achievements.length === 0) {
            toast.error('Please select at least one achievement');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const submitFormData = new FormData();
            submitFormData.append('registrationId', formData.registrationId);
            submitFormData.append('hackathonId', formData.hackathonId);
            submitFormData.append('description', formData.description);
            submitFormData.append('repoUrl', formData.repoUrl);
            submitFormData.append('demoUrl', formData.demoUrl);
            submitFormData.append(
                'projectLinks',
                JSON.stringify(formData.projectLinks.filter((link) => link.trim()))
            );
            submitFormData.append('achievements', JSON.stringify(formData.achievements));

            certificates.forEach((file) => {
                submitFormData.append('certificates', file);
            });

            await submissionService.createSubmission(submitFormData);

            // Reset form
            setFormData({
                registrationId: '',
                hackathonId: '',
                description: '',
                repoUrl: '',
                demoUrl: '',
                projectLinks: [''],
                achievements: [],
            });
            setCertificates([]);

            onSuccess();
        } catch (error: any) {
            console.error('Error creating submission:', error);
            toast.error(error.response?.data?.error || 'Failed to create submission');
        } finally {
            setLoading(false);
        }
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
                            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                                <h2 className="text-2xl font-bold text-gray-900">Create Post-Event Submission</h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Registration Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Competition <span className="text-red-500">*</span>
                                    </label>
                                    {loadingRegistrations ? (
                                        <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                    ) : (
                                        <select
                                            value={formData.registrationId}
                                            onChange={(e) => handleRegistrationChange(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select a competition</option>
                                            {approvedRegistrations.map((reg) => (
                                                <option key={reg.id} value={reg.id}>
                                                    {reg.hackathonId} {reg.teamName ? `- ${reg.teamName}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Only approved registrations are shown
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Project Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe your project, what you built, and what you achieved..."
                                        required
                                    />
                                </div>

                                {/* Repository URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Repository URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.repoUrl}
                                        onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://github.com/username/project"
                                    />
                                </div>

                                {/* Demo URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Demo URL</label>
                                    <input
                                        type="url"
                                        value={formData.demoUrl}
                                        onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://your-project-demo.com"
                                    />
                                </div>

                                {/* Project Links */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Project Links
                                    </label>
                                    <div className="space-y-2">
                                        {formData.projectLinks.map((link, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={link}
                                                    onChange={(e) => updateProjectLink(index, e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="https://..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeProjectLink(index)}
                                                    className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addProjectLink}
                                            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            <span>Add Link</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Certificates Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Upload Certificates (Max 5)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <label className="cursor-pointer">
                                            <span className="text-blue-600 hover:text-blue-800">Choose files</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">PDF or Images, max 10MB each</p>
                                    </div>
                                    {certificates.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {certificates.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                                >
                                                    <span className="text-sm text-gray-700">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Achievements */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Achievements <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                                        {ACHIEVEMENT_TYPES.map((achievement) => (
                                            <button
                                                key={achievement.type}
                                                type="button"
                                                onClick={() => addAchievement(achievement.type)}
                                                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                + {achievement.label}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.achievements.length > 0 && (
                                        <div className="space-y-2">
                                            {formData.achievements.map((achievement, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                                                >
                                                    <div>
                                                        <span className="font-medium text-purple-900">{achievement.title}</span>
                                                        <span className="text-sm text-purple-600 ml-2">
                                                            +{achievement.points} points
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAchievement(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                        {loading ? 'Submitting...' : 'Submit'}
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
