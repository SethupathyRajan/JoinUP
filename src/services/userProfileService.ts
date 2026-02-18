import { User, GameStats, Achievement, Badge } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export interface UserProfileData {
  user: User;
  gameStats: GameStats;
  achievements: Achievement[];
  badges: Badge[];
}

export const userProfileService = {
  getUserProfile: async (userId: string): Promise<UserProfileData> => {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.USER.BASE}/${userId}/profile`,
      {},
      true
    );

    return {
      user: response.data.user,
      gameStats: response.data.gameStats || {
        points: 0,
        level: 1,
        badges: [],
        streaks: { daily: 0, weekly: 0, hackathon: 0, lastUpdated: new Date() },
        achievements: [],
        totalParticipations: 0,
        totalWins: 0
      },
      achievements: response.data.achievements || [],
      badges: response.data.badges || []
    };
  },

  getUserParticipations: async (userId: string): Promise<any[]> => {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.USER.BASE}/${userId}/participations`,
      {},
      true
    );
    return response.data.participations || [];
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.USER.SEARCH}?query=${encodeURIComponent(query)}`,
      {},
      true
    );
    return response.data.users || [];
  }
};
