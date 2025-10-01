import { Analytics } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export const analyticsService = {
  // Get dashboard analytics
  getDashboardStats: async (): Promise<Analytics> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD, {}, true);
    return response.data;
  },

  // Get user statistics
  getUserStats: async (): Promise<any> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.ANALYTICS.USER_STATS, {}, true);
    return response.data;
  },

  // Get hackathon specific statistics
  getHackathonStats: async (id: string): Promise<any> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.ANALYTICS.HACKATHON_STATS(id), {}, true);
    return response.data;
  },
};
