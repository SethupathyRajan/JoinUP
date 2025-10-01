import { db } from '../server.js';
import { User, GameStats, Badge, Achievement, UserStreak, LeaderboardEntry, CompetitionAchievement } from '../models/types.js';
import { sendEmail } from './email.js';

// Points awarded for different actions (from requirements)
export const POINTS = {
  REGISTER_COMPETITION: 50,
  COMPLETE_TEAM_REGISTRATION: 75,
  SUBMIT_ON_TIME: 100,
  SUBMIT_LATE: 50,
  WINNER: 500,
  RUNNER_UP: 350,
  THIRD_PLACE: 250,
  TOP_10: 150,
  PARTICIPATION_COMPLETION: 100,
  SPECIAL_RECOGNITION: 200,
  FIRST_TIME_PARTICIPANT: 100,
  TEAM_LEADER_ROLE: 50,
  MENTOR_TEAM: 150,
  DETAILED_DOCUMENTATION: 75,
  PUBLIC_PRESENTATION: 100,
  POSITIVE_FACULTY_FEEDBACK: 50,
  DAILY_LOGIN: 10,
  WEEKLY_LOGIN_BONUS_7_DAYS: 50,
  WEEKLY_LOGIN_BONUS_30_DAYS: 200,
  WEEKLY_LOGIN_BONUS_100_DAYS: 500,
};

// Level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, name: 'Newcomer' },
  { level: 2, minPoints: 500, name: 'Explorer' },
  { level: 3, minPoints: 1000, name: 'Competitor' },
  { level: 4, minPoints: 2000, name: 'Champion' },
  { level: 5, minPoints: 3500, name: 'Expert' },
  { level: 6, minPoints: 5500, name: 'Master' },
  { level: 7, minPoints: 8000, name: 'Legend' },
  { level: 8, minPoints: 11500, name: 'Elite' },
  { level: 9, minPoints: 16000, name: 'Grandmaster' },
  { level: 10, minPoints: 22000, name: 'Hall of Fame' },
];

// Badge definitions
export const BADGE_DEFINITIONS: Badge[] = [
  // Participation Badges (Common)
  {
    id: 'first-timer',
    name: 'First Timer',
    description: 'Complete first competition registration',
    icon: '🌟',
    rarity: 'common',
    criteria: 'Complete first competition registration',
    pointsRequired: 0,
    color: '#28a745',
    category: 'participation'
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Participate in 3+ team competitions',
    icon: '👥',
    rarity: 'common',
    criteria: 'Participate in 3+ team competitions',
    pointsRequired: 0,
    color: '#17a2b8',
    category: 'participation'
  },
  {
    id: 'solo-warrior',
    name: 'Solo Warrior',
    description: 'Win a solo competition',
    icon: '🗡️',
    rarity: 'common',
    criteria: 'Win a solo competition',
    pointsRequired: 0,
    color: '#dc3545',
    category: 'participation'
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Participate in competitions for 3 consecutive months',
    icon: '📅',
    rarity: 'common',
    criteria: 'Participate in competitions for 3 consecutive months',
    pointsRequired: 0,
    color: '#6f42c1',
    category: 'participation'
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Register within first 24 hours of competition announcement',
    icon: '🐦',
    rarity: 'common',
    criteria: 'Register within first 24 hours',
    pointsRequired: 0,
    color: '#fd7e14',
    category: 'participation'
  },

  // Achievement Badges (Rare)
  {
    id: 'hat-trick',
    name: 'Hat Trick',
    description: 'Win 3 competitions in a row',
    icon: '🎩',
    rarity: 'rare',
    criteria: 'Win 3 competitions consecutively',
    pointsRequired: 0,
    color: '#ffc107',
    category: 'achievement'
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Win after finishing last in previous competition',
    icon: '💪',
    rarity: 'rare',
    criteria: 'Win after finishing last previously',
    pointsRequired: 0,
    color: '#20c997',
    category: 'achievement'
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Help 5+ teams as a mentor',
    icon: '🎓',
    rarity: 'rare',
    criteria: 'Mentor 5+ teams',
    pointsRequired: 0,
    color: '#6610f2',
    category: 'achievement'
  },

  // Mastery Badges (Epic)
  {
    id: 'domain-expert',
    name: 'Domain Expert',
    description: 'Win 3+ competitions in same category',
    icon: '🏆',
    rarity: 'epic',
    criteria: 'Win 3+ competitions in same category',
    pointsRequired: 0,
    color: '#e83e8c',
    category: 'mastery'
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    description: 'Place top 3 in 3 different competition categories',
    icon: '🎯',
    rarity: 'epic',
    criteria: 'Top 3 in 3 different categories',
    pointsRequired: 0,
    color: '#fd7e14',
    category: 'mastery'
  },

  // Elite Badges (Legendary)
  {
    id: 'champion',
    name: 'Champion',
    description: 'Win 10+ competitions',
    icon: '👑',
    rarity: 'legendary',
    criteria: 'Win 10+ competitions',
    pointsRequired: 0,
    color: '#ffd700',
    category: 'elite'
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Maintain top 3 leaderboard position for 6+ months',
    icon: '⚡',
    rarity: 'legendary',
    criteria: 'Top 3 for 6+ months',
    pointsRequired: 0,
    color: '#ff6b6b',
    category: 'elite'
  }
];

// Get user's current level based on points
export const calculateLevel = (points: number): { level: number; name: string; nextLevelPoints: number } => {
  let currentLevel = LEVEL_THRESHOLDS[0];
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      currentLevel = LEVEL_THRESHOLDS[i];
      break;
    }
  }
  
  const nextLevel = LEVEL_THRESHOLDS.find(level => level.level === currentLevel.level + 1);
  const nextLevelPoints = nextLevel ? nextLevel.minPoints : currentLevel.minPoints;
  
  return {
    level: currentLevel.level,
    name: currentLevel.name,
    nextLevelPoints
  };
};

// Award points to user
export const awardPoints = async (userId: string, points: number, reason: string): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as User;
    const currentLevel = calculateLevel(userData.gameStats.points);
    const newPoints = userData.gameStats.points + points;
    const newLevel = calculateLevel(newPoints);
    
    // Check for level up
    const leveledUp = newLevel.level > currentLevel.level;
    
    // Update user points and level
    await userRef.update({
      'gameStats.points': newPoints,
      'gameStats.level': newLevel.level,
      updatedAt: new Date()
    });
    
    // Log the point award
    await db.collection('pointsHistory').add({
      userId,
      points,
      reason,
      timestamp: new Date(),
      previousTotal: userData.gameStats.points,
      newTotal: newPoints,
      leveledUp,
      oldLevel: currentLevel.level,
      newLevel: newLevel.level
    });
    
    // Send level up notification if applicable
    if (leveledUp) {
      await createNotification(userId, {
        title: `🎉 Level Up! You're now ${newLevel.name}!`,
        message: `Congratulations! You've reached level ${newLevel.level} and earned the title "${newLevel.name}".`,
        type: 'achievement'
      });
      
      // Send email notification
      await sendEmail({
        to: userData.email,
        subject: `🎉 Level Up! You're now ${newLevel.name}!`,
        template: 'level-up',
        context: {
          userName: userData.name,
          oldLevel: currentLevel.level,
          newLevel: newLevel.level,
          levelName: newLevel.name,
          totalPoints: newPoints
        }
      });
    }
    
    // Check for new achievements
    await checkAndAwardAchievements(userId);
    
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
};

// Update user streaks
export const updateStreaks = async (userId: string, activityType: 'login' | 'weekly' | 'hackathon'): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as User;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let updates: any = {
      'gameStats.streaks.lastUpdated': now,
      updatedAt: now
    };
    
    if (activityType === 'login') {
      const lastLogin = userData.gameStats.streaks.lastDailyLogin;
      const lastLoginDate = lastLogin ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()) : null;
      
      // Check if this is a new day
      if (!lastLoginDate || lastLoginDate.getTime() !== today.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let newDailyStreak = 1;
        
        // If logged in yesterday, increment streak
        if (lastLoginDate && lastLoginDate.getTime() === yesterday.getTime()) {
          newDailyStreak = userData.gameStats.streaks.daily + 1;
        }
        
        updates['gameStats.streaks.daily'] = newDailyStreak;
        updates['gameStats.streaks.lastDailyLogin'] = now;
        
        // Award bonus points for streak milestones
        if (newDailyStreak === 7) {
          await awardPoints(userId, POINTS.WEEKLY_LOGIN_BONUS_7_DAYS, '7-day login streak bonus');
        } else if (newDailyStreak === 30) {
          await awardPoints(userId, POINTS.WEEKLY_LOGIN_BONUS_30_DAYS, '30-day login streak bonus');
        } else if (newDailyStreak === 100) {
          await awardPoints(userId, POINTS.WEEKLY_LOGIN_BONUS_100_DAYS, '100-day login streak bonus');
        }
      }
    }
    
    await userRef.update(updates);
    
  } catch (error) {
    console.error('Error updating streaks:', error);
    throw error;
  }
};

// Check and award achievements/badges
export const checkAndAwardAchievements = async (userId: string): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return;
    }
    
    const userData = userDoc.data() as User;
    const currentBadgeIds = userData.gameStats.badges.map(badge => badge.id);
    const newBadges: Badge[] = [];
    
    // Get user's competition history for badge checks
    const registrationsQuery = await db.collection('registrations')
      .where('userId', '==', userId)
      .where('status', '==', 'approved')
      .get();
    
    const totalParticipations = registrationsQuery.size;
    
    // Check for First Timer badge
    if (totalParticipations >= 1 && !currentBadgeIds.includes('first-timer')) {
      const firstTimerBadge = BADGE_DEFINITIONS.find(b => b.id === 'first-timer');
      if (firstTimerBadge) newBadges.push(firstTimerBadge);
    }
    
    // Check for Team Player badge
    const teamRegistrationsQuery = await db.collection('registrations')
      .where('userId', '==', userId)
      .where('status', '==', 'approved')
      .get();
    
    const teamParticipations = teamRegistrationsQuery.docs.filter(doc => 
      doc.data().teamMembers && doc.data().teamMembers.length > 0
    ).length;
    
    if (teamParticipations >= 3 && !currentBadgeIds.includes('team-player')) {
      const teamPlayerBadge = BADGE_DEFINITIONS.find(b => b.id === 'team-player');
      if (teamPlayerBadge) newBadges.push(teamPlayerBadge);
    }
    
    // Check for Champion badge (10+ wins)
    if (userData.gameStats.totalWins >= 10 && !currentBadgeIds.includes('champion')) {
      const championBadge = BADGE_DEFINITIONS.find(b => b.id === 'champion');
      if (championBadge) newBadges.push(championBadge);
    }
    
    // Award new badges
    if (newBadges.length > 0) {
      const updatedBadges = [...userData.gameStats.badges, ...newBadges];
      
      await userRef.update({
        'gameStats.badges': updatedBadges,
        updatedAt: new Date()
      });
      
      // Create notifications for new badges
      for (const badge of newBadges) {
        await createNotification(userId, {
          title: `🏆 New Badge Earned: ${badge.name}!`,
          message: `You've earned the ${badge.name} badge: ${badge.description}`,
          type: 'achievement'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

// Process competition results and award points
export const processCompetitionResult = async (
  userId: string, 
  hackathonId: string, 
  achievements: CompetitionAchievement[]
): Promise<void> => {
  try {
    let totalPointsAwarded = 0;
    
    for (const achievement of achievements) {
      let points = 0;
      
      switch (achievement.type) {
        case 'winner':
          points = POINTS.WINNER;
          break;
        case 'runner_up':
          points = POINTS.RUNNER_UP;
          break;
        case 'third_place':
          points = POINTS.THIRD_PLACE;
          break;
        case 'top_10':
          points = POINTS.TOP_10;
          break;
        case 'participation':
          points = POINTS.PARTICIPATION_COMPLETION;
          break;
        case 'special_recognition':
          points = POINTS.SPECIAL_RECOGNITION;
          break;
      }
      
      if (points > 0) {
        await awardPoints(userId, points, `${achievement.title} - ${achievement.type}`);
        totalPointsAwarded += points;
      }
    }
    
    // Update total wins if user won
    if (achievements.some(a => a.type === 'winner')) {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        'gameStats.totalWins': db.FieldValue.increment(1),
        'gameStats.totalParticipations': db.FieldValue.increment(1),
        updatedAt: new Date()
      });
    } else {
      // Just update participations
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        'gameStats.totalParticipations': db.FieldValue.increment(1),
        updatedAt: new Date()
      });
    }
    
    console.log(`Awarded ${totalPointsAwarded} points to user ${userId} for competition ${hackathonId}`);
    
  } catch (error) {
    console.error('Error processing competition result:', error);
    throw error;
  }
};

// Get leaderboard
export const getLeaderboard = async (
  limit: number = 50, 
  department?: string, 
  year?: number
): Promise<LeaderboardEntry[]> => {
  try {
    let query = db.collection('users')
      .orderBy('gameStats.points', 'desc')
      .limit(limit);
    
    if (department) {
      query = query.where('department', '==', department);
    }
    
    if (year) {
      query = query.where('year', '==', year);
    }
    
    const snapshot = await query.get();
    
    const leaderboard: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
      const userData = doc.data() as User;
      return {
        userId: userData.id,
        userName: userData.name,
        department: userData.department,
        year: userData.year,
        points: userData.gameStats.points,
        level: userData.gameStats.level,
        totalParticipations: userData.gameStats.totalParticipations,
        totalWins: userData.gameStats.totalWins,
        rank: index + 1,
        streaks: userData.gameStats.streaks
      };
    });
    
    return leaderboard;
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

// Helper function to create notifications
const createNotification = async (userId: string, notification: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  actionUrl?: string;
}) => {
  await db.collection('notifications').add({
    userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: false,
    createdAt: new Date(),
    actionUrl: notification.actionUrl
  });
};
