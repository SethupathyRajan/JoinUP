import { db } from '../server.js';
import { User, Achievement } from '../models/types.js';
import { createNotification } from './notificationHelper.js';

// Achievement definitions matching the Achievement interface
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Participation Achievements
  {
    id: 'first-timer',
    title: 'First Timer',
    description: 'Completed your first competition registration',
    icon: '🌟',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 50
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Registered within 24 hours of competition announcement',
    icon: '🐦',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 25
  },
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Participated in 3+ team competitions',
    icon: '👥',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 100
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Participated in competitions for 3 consecutive months',
    icon: '📅',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 150
  },
  {
    id: 'solo-warrior',
    title: 'Solo Warrior',
    description: 'Won a solo competition',
    icon: '🗡️',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 200
  },

  // Performance Achievements
  {
    id: 'hat-trick',
    title: 'Hat Trick',
    description: 'Won 3 competitions in a row',
    icon: '🎩',
    unlockedAt: new Date(),
    category: 'special',
    points: 500
  },
  {
    id: 'comeback-kid',
    title: 'Comeback Kid',
    description: 'Won after being rejected previously',
    icon: '💪',
    unlockedAt: new Date(),
    category: 'special',
    points: 300
  },
  {
    id: 'champion',
    title: 'Champion',
    description: 'Won 10+ competitions',
    icon: '👑',
    unlockedAt: new Date(),
    category: 'special',
    points: 1000
  },
  {
    id: 'domain-expert',
    title: 'Domain Expert',
    description: 'Won 3+ competitions in the same category',
    icon: '🏆',
    unlockedAt: new Date(),
    category: 'special',
    points: 750
  },
  {
    id: 'all-rounder',
    title: 'All-Rounder',
    description: 'Placed top 3 in 3 different categories',
    icon: '🎯',
    unlockedAt: new Date(),
    category: 'special',
    points: 600
  },

  // Streak Achievements
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 50
  },
  {
    id: 'streak-30',
    title: 'Month Master',
    description: 'Maintained a 30-day streak',
    icon: '⚡',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 200
  },
  {
    id: 'streak-100',
    title: 'Centurion',
    description: 'Maintained a 100-day streak',
    icon: '💯',
    unlockedAt: new Date(),
    category: 'milestone',
    points: 500
  },

  // Special Achievements
  {
    id: 'mentor',
    title: 'Mentor',
    description: 'Helped 5+ teams as a mentor',
    icon: '🎓',
    unlockedAt: new Date(),
    category: 'special',
    points: 400
  },
  {
    id: 'legend',
    title: 'Legend',
    description: 'Maintained top 3 leaderboard position for 6+ months',
    icon: '⭐',
    unlockedAt: new Date(),
    category: 'special',
    points: 1500
  },
  {
    id: 'hall-of-fame',
    title: 'Hall of Fame',
    description: 'Reached maximum level (Level 10)',
    icon: '🏛️',
    unlockedAt: new Date(),
    category: 'special',
    points: 2000
  }
];

// Check and award achievements for a user
export const checkAndAwardAchievements = async (
  userId: string, 
  context?: {
    registrationId?: string;
    hackathonId?: string;
    isEarlyRegistration?: boolean;
    isTeamRegistration?: boolean;
    isWin?: boolean;
    category?: string;
  }
): Promise<Achievement[]> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return [];
    }
    
    const userData = userDoc.data() as User;
    const currentAchievementIds = (userData.gameStats?.achievements || []).map((a: Achievement) => a.id);
    const newAchievements: Achievement[] = [];
    
    // Get user's registration history
    const registrationsQuery = await db.collection('registrations')
      .where('userId', '==', userId)
      .where('status', '==', 'approved')
      .get();
    
    const totalParticipations = registrationsQuery.size;
    const registrations = registrationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get hackathon details for registrations
    const hackathonIds = registrations.map(r => r.hackathonId);
    const hackathons: any[] = [];
    for (const hackathonId of hackathonIds) {
      const hackathonDoc = await db.collection('hackathons').doc(hackathonId).get();
      if (hackathonDoc.exists) {
        hackathons.push({ id: hackathonDoc.id, ...hackathonDoc.data() });
      }
    }
    
    // Check First Timer
    if (totalParticipations >= 1 && !currentAchievementIds.includes('first-timer')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'first-timer');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Check Early Bird (if context provided)
    if (context?.isEarlyRegistration && !currentAchievementIds.includes('early-bird')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'early-bird');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Check Team Player
    const teamRegistrations = registrations.filter(r => 
      r.teamMembers && Array.isArray(r.teamMembers) && r.teamMembers.length > 0
    );
    if (teamRegistrations.length >= 3 && !currentAchievementIds.includes('team-player')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'team-player');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Check Solo Warrior (win without team) - will be checked when win is processed
    // This is handled in processCompetitionResult
    
    // Check Champion (10+ wins)
    if (userData.gameStats?.totalWins >= 10 && !currentAchievementIds.includes('champion')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'champion');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Check Domain Expert (3+ wins in same category)
    if (context?.category && userData.gameStats?.totalWins >= 3) {
      const winsInCategory = hackathons.filter(h => 
        h.category === context.category && 
        registrations.some(r => r.hackathonId === h.id && r.status === 'approved')
      ).length;
      
      if (winsInCategory >= 3 && !currentAchievementIds.includes('domain-expert')) {
        const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'domain-expert');
        if (achievement) {
          const newAchievement = { ...achievement, unlockedAt: new Date() };
          newAchievements.push(newAchievement);
        }
      }
    }
    
    // Check Streak Achievements
    const dailyStreak = userData.gameStats?.streaks?.daily || 0;
    if (dailyStreak >= 7 && !currentAchievementIds.includes('streak-7')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak-7');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    if (dailyStreak >= 30 && !currentAchievementIds.includes('streak-30')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak-30');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    if (dailyStreak >= 100 && !currentAchievementIds.includes('streak-100')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak-100');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Check Hall of Fame (Level 10)
    if (userData.gameStats?.level >= 10 && !currentAchievementIds.includes('hall-of-fame')) {
      const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'hall-of-fame');
      if (achievement) {
        const newAchievement = { ...achievement, unlockedAt: new Date() };
        newAchievements.push(newAchievement);
      }
    }
    
    // Award new achievements
    if (newAchievements.length > 0) {
      const updatedAchievements = [...(userData.gameStats?.achievements || []), ...newAchievements];
      
      await userRef.update({
        'gameStats.achievements': updatedAchievements,
        updatedAt: new Date()
      });
      
      // Create notifications for new achievements
      for (const achievement of newAchievements) {
        await createNotification(userId, {
          title: `🏆 Achievement Unlocked: ${achievement.title}!`,
          message: achievement.description,
          type: 'achievement',
          actionUrl: '/profile'
        });
      }
    }
    
    return newAchievements;
    
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};
