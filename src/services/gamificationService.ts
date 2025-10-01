import { GameStats, LeaderboardEntry, Badge, Achievement } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export const gamificationService = {
  // Get user's gamification stats
  getStats: async (): Promise<GameStats> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.STATS, {}, true);
    return response.data || {
      points: 0,
      level: 1,
      badges: [],
      streaks: { daily: 0, weekly: 0, hackathon: 0, lastUpdated: new Date() },
      achievements: [],
      totalParticipations: 0,
      totalWins: 0
    };
  },

  // Get leaderboard (students only)
  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.LEADERBOARD, {}, true);
    // Filter out admin users from leaderboard
    const leaderboard = response.data?.leaderboard || [];
    return leaderboard.filter((entry: LeaderboardEntry) => !entry.isAdmin);
  },

  // Get available badges
  getBadges: async (): Promise<Badge[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.BADGES, {}, true);
    return response.data?.badges || [];
  },

  // Get user achievements
  getAchievements: async (): Promise<Achievement[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.GAMIFICATION.ACHIEVEMENTS, {}, true);
    return response.data?.achievements || [];
  },
};
