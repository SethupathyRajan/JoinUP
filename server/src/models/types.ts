// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  year: number;
  rollNumber: string;
  registerNumber: string;
  phoneNumber?: string;
  profilePicture?: string;
  gameStats: GameStats;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department: string;
  year: number;
  rollNumber: string;
  registerNumber: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Gamification Types
export interface GameStats {
  points: number;
  level: number;
  badges: Badge[];
  streaks: UserStreak;
  achievements: Achievement[];
  totalParticipations: number;
  totalWins: number;
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
  category: 'participation' | 'achievement' | 'mastery' | 'elite';
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
  category: 'milestone' | 'special' | 'seasonal';
  points: number;
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
  streaks: UserStreak;
}

// Competition Types
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
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isExternal?: boolean; // For web-scraped competitions
  externalUrl?: string;
}

export interface Registration {
  id: string;
  hackathonId: string;
  userId: string;
  teamName?: string;
  teamMembers: TeamMember[];
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  priority: 'low' | 'medium' | 'high';
  isTeamLeader: boolean;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: number;
  role: 'leader' | 'member';
}

// Post-Event Submission Types
export interface PostEventSubmission {
  id: string;
  registrationId: string;
  userId: string;
  hackathonId: string;
  certificates: CertificateInfo[];
  projectLinks: string[];
  repoUrl?: string;
  demoUrl?: string;
  description: string;
  achievements: CompetitionAchievement[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  pointsAwarded?: number;
}

export interface CertificateInfo {
  fileName: string;
  originalName: string;
  googleDriveFileId: string;
  uploadedAt: Date;
  fileSize: number;
  mimeType: string;
}

export interface CompetitionAchievement {
  type: 'winner' | 'runner_up' | 'third_place' | 'top_10' | 'participation' | 'special_recognition';
  title: string;
  description?: string;
  points: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// Analytics Types
export interface Analytics {
  totalUsers: number;
  totalStudents: number;
  totalHackathons: number;
  totalRegistrations: number;
  approvalRate: number;
  departmentDistribution: Record<string, number>;
  yearDistribution: Record<string, number>;
  monthlyParticipation: Record<string, number>;
  topPerformers: LeaderboardEntry[];
  competitionCategories: Record<string, number>;
  averageTeamSize: number;
}

// Filter and Query Types
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
  category?: string[];
  year?: number[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Validation Schema Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Google Drive Integration Types
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
}

// Web Scraping Types (placeholder for future implementation)
export interface ScrapedCompetition {
  title: string;
  description: string;
  organizerName: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  sourceUrl: string;
  category: string;
  prizeMoney?: number;
  location?: string;
  tags: string[];
}

export interface ScrapingSource {
  id: string;
  name: string;
  baseUrl: string;
  selectors: Record<string, string>;
  isActive: boolean;
}

// Email Templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailContext {
  userName: string;
  hackathonTitle?: string;
  teamName?: string;
  status?: string;
  feedback?: string;
  resetLink?: string;
  loginUrl?: string;
  [key: string]: any;
}
