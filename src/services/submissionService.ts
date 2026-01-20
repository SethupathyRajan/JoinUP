import { apiRequest, API_CONFIG } from '../config/api';
import { PostEventSubmission } from '../types';

export const submissionService = {
    // Create new submission
    createSubmission: async (formData: FormData): Promise<{ submissionId: string }> => {
        const response = await apiRequest(`${API_CONFIG.BASE_URL}/submissions`, {
            method: 'POST',
            body: formData,
        }, true);
        return response.data;
    },

    // Get all submissions for current user
    getSubmissions: async (status?: string): Promise<PostEventSubmission[]> => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        const url = `${API_CONFIG.BASE_URL}/submissions${status ? `?${params.toString()}` : ''}`;
        const response = await apiRequest(url, {}, true);
        return response.data?.submissions || [];
    },

    // Get specific submission
    getSubmission: async (id: string): Promise<PostEventSubmission> => {
        const response = await apiRequest(`${API_CONFIG.BASE_URL}/submissions/${id}`, {}, true);
        return response.data?.submission;
    },

    // Update submission status (admin only)
    updateSubmissionStatus: async (
        id: string,
        status: 'approved' | 'rejected',
        feedback?: string,
        pointsAwarded?: number
    ): Promise<void> => {
        await apiRequest(`${API_CONFIG.BASE_URL}/submissions/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status,
                feedback,
                pointsAwarded,
            }),
        }, true);
    },

    // Delete submission
    deleteSubmission: async (id: string): Promise<void> => {
        await apiRequest(`${API_CONFIG.BASE_URL}/submissions/${id}`, {
            method: 'DELETE',
        }, true);
    },
};
