import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    LinkIcon,
    CodeBracketIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { submissionService } from '../../services/submissionService';
import { PostEventSubmission } from '../../types';
import { CreateSubmissionModal } from './CreateSubmissionModal';
import toast from 'react-hot-toast';

export const SubmissionsPage: React.FC = () => {
    const [submissions, setSubmissions] = useState<PostEventSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const status = filterStatus === 'all' ? undefined : filterStatus;
            const data = await submissionService.getSubmissions(status);
            setSubmissions(data);
        } catch (error: any) {
            console.error('Error fetching submissions:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [filterStatus]);

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchSubmissions();
        toast.success('Submission created successfully!');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            case 'rejected':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Post-Event Submissions</h1>
                    <p className="text-gray-600 mt-1">Submit your project details and achievements</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Submission</span>
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Summary Stats */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                                <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {submissions.filter((s) => s.status === 'approved').length}
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
                                    {submissions.filter((s) => s.status === 'pending').length}
                                </p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {submissions
                                        .filter((s) => s.status === 'approved')
                                        .reduce((sum, s) => sum + (s.pointsAwarded || 0), 0)}
                                </p>
                            </div>
                            <DocumentTextIcon className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
                            >
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
                        <p className="text-gray-600 mb-4">
                            Submit your project details after completing a competition!
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                        >
                            Create Submission
                        </button>
                    </div>
                ) : (
                    submissions.map((submission, index) => (
                        <motion.div
                            key={submission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                Submission for Competition
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Submitted on {format(toDate(submission.submittedAt), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(submission.status)}
                                            <span
                                                className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                                                    submission.status
                                                )}`}
                                            >
                                                {submission.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {submission.description && (
                                        <div className="mb-4">
                                            <p className="text-gray-700">{submission.description}</p>
                                        </div>
                                    )}

                                    {/* Links */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        {submission.repoUrl && (
                                            <a
                                                href={submission.repoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                <CodeBracketIcon className="h-4 w-4" />
                                                <span>Repository</span>
                                            </a>
                                        )}
                                        {submission.demoUrl && (
                                            <a
                                                href={submission.demoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                <span>Live Demo</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Project Links */}
                                    {submission.projectLinks && submission.projectLinks.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Project Links:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {submission.projectLinks.map((link, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        Link {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Certificates */}
                                    {submission.certificates && submission.certificates.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                Certificates ({submission.certificates.length}):
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {submission.certificates.map((cert, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                                    >
                                                        {cert.originalName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Achievements */}
                                    {submission.achievements && submission.achievements.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Achievements:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {submission.achievements.map((achievement, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                                                    >
                                                        {achievement.title} (+{achievement.points} pts)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Points Awarded */}
                                    {submission.status === 'approved' && submission.pointsAwarded && (
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800">
                                                <strong>Points Awarded:</strong> {submission.pointsAwarded}
                                            </p>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {submission.feedback && (
                                        <div className="p-3 bg-gray-50 rounded-lg mt-3">
                                            <p className="text-sm text-gray-700">
                                                <strong>Feedback:</strong> {submission.feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Submission Modal */}
            <CreateSubmissionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
};
