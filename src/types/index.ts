export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  year: number;
  rollNumber: string;
  registerNumber: string;
  phoneNumber: string;
  profilePicture?: string;
  isAdmin?: boolean;
  gameStats?: GameStats;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface GameStats {
  points: number;
  level: number;
  badges: Badge[];
  streaks: UserStreak;
  achievements: Achievement[];
  totalParticipations: number;
  totalWins: number;
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxTeamSize: number;
  minTeamSize: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  prizeMoney?: number;
  location?: string;
  requirements?: string[];
}

export interface Registration {
  id: string;
  hackathonId: string;
  userId: string;
  teamName?: string;
  teamMembers: string[];
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PostEventSubmission {
  id: string;
  registrationId: string;
  userId: string;
  hackathonId: string;
  certificates: string[];
  projectLinks: string[];
  repoUrl?: string;
  demoUrl?: string;
  description: string;
  achievements: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  pointsAwarded?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: string;
  pointsRequired: number;
  color: string;
}

export interface UserStreak {
  daily: number;
  weekly: number;
  hackathon: number;
  lastUpdated: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'participation' | 'performance' | 'streak' | 'special';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface Analytics {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalHackathons: number;
  totalRegistrations: number;
  approvalRate: number;
  departmentDistribution: Record<string, number>;
  yearDistribution: Record<string, number>;
  monthlyParticipation: Record<string, number>;
  topPerformers: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  department: string;
  year: number;
  points: number;
  level: number;
  totalParticipations: number;
  totalWins: number;
  rank: number;
  streak: number;
  badges?: string[];
  isAdmin?: boolean;
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  month?: string;
  academicYear?: string;
  student?: string;
  status?: string[];
  department?: string;
}




