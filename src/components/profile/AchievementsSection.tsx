import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Target, Flame, Star, Zap } from 'lucide-react';
import { Achievement, Badge } from '../../types';

interface AchievementsSectionProps {
  achievements: Achievement[];
  badges: Badge[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  badges
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'participation':
        return Target;
      case 'performance':
        return Trophy;
      case 'streak':
        return Flame;
      case 'special':
        return Star;
      default:
        return Award;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'epic':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      case 'common':
        return 'from-gray-400 to-gray-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const topAchievements = achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
          Top Achievements
        </h3>

        {topAchievements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No achievements unlocked yet. Keep participating to earn your first achievement!
          </p>
        ) : (
          <div className="space-y-4">
            {topAchievements.map((achievement, index) => {
              const Icon = getCategoryIcon(achievement.category);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {achievement.category}
                      </span>
                      <span className="ml-3">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {achievements.length > 3 && (
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              {achievements.length - 3} more achievements unlocked
            </span>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-6 w-6 mr-2 text-purple-500" />
          Badges Collection
        </h3>

        {badges.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No badges earned yet. Complete challenges to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4 className="text-sm font-semibold text-white mb-1">{badge.name}</h4>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full border ${getRarityBadge(badge.rarity)} capitalize`}>
                    {badge.rarity}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center px-3">
                    <p className="text-xs">{badge.description}</p>
                    <p className="text-xs mt-2 font-semibold">{badge.pointsRequired} pts</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-green-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Keep Going!</h4>
              <p className="text-sm text-gray-600">
                You have {achievements.length} achievements and {badges.length} badges
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{achievements.length + badges.length}</p>
            <p className="text-xs text-gray-600">Total Rewards</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
