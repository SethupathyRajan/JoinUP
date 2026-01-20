// Use environment variable or fallback
// In development with Vite proxy, we can use relative URLs
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: `${API_BASE_URL}/auth/login`,
      REGISTER: `${API_BASE_URL}/auth/register`,
      VERIFY_TOKEN: `${API_BASE_URL}/auth/verify-token`,
      CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
      FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
      RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
      LOGOUT: `${API_BASE_URL}/auth/logout`,
    },
    
    // User endpoints
    USER: {
      SEARCH: `${API_BASE_URL}/user/search`,
      PROFILE: `${API_BASE_URL}/user/profile`,
      UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile`,
      UPLOAD_AVATAR: `${API_BASE_URL}/user/upload-avatar`,
      DELETE_ACCOUNT: `${API_BASE_URL}/user/delete-account`,
    },
    
    // Hackathon endpoints
    HACKATHON: {
      LIST: `${API_BASE_URL}/hackathon`,
      CREATE: `${API_BASE_URL}/hackathon`,
      DETAILS: (id: string) => `${API_BASE_URL}/hackathon/${id}`,
      UPDATE: (id: string) => `${API_BASE_URL}/hackathon/${id}`,
      DELETE: (id: string) => `${API_BASE_URL}/hackathon/${id}`,
    },
    
    // Registration endpoints
    REGISTRATION: {
      // Server expects POST to /api/registration
      REGISTER: `${API_BASE_URL}/registration`,
      LIST: `${API_BASE_URL}/registration`,
      DETAILS: (id: string) => `${API_BASE_URL}/registration/${id}`,
      UPDATE_STATUS: (id: string) => `${API_BASE_URL}/registration/${id}/status`,
      DOWNLOAD_CERTIFICATE: (id: string) => `${API_BASE_URL}/registration/${id}/certificate`,
    },
    
    // Gamification endpoints
    GAMIFICATION: {
      STATS: `${API_BASE_URL}/gamification/stats`,
      LEADERBOARD: `${API_BASE_URL}/gamification/leaderboard`,
      BADGES: `${API_BASE_URL}/gamification/badges`,
      ACHIEVEMENTS: `${API_BASE_URL}/gamification/achievements`,
    },
    
    // Analytics endpoints
    ANALYTICS: {
      DASHBOARD: `${API_BASE_URL}/analytics/dashboard`,
      USER_STATS: `${API_BASE_URL}/analytics/user-stats`,
      HACKATHON_STATS: (id: string) => `${API_BASE_URL}/analytics/hackathon/${id}`,
    },
    
    // Upload endpoints
    UPLOAD: {
      PROFILE_PICTURE: `${API_BASE_URL}/upload/profile-picture`,
      CERTIFICATE: `${API_BASE_URL}/upload/certificate`,
    },
    
    // Notification endpoints
    NOTIFICATION: {
      LIST: `${API_BASE_URL}/notification`,
      MARK_READ: (id: string) => `${API_BASE_URL}/notification/mark-read`,
      SEND: `${API_BASE_URL}/notification/send`,
    },
  }
};

// Helper function to create authenticated headers
export const createAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function for API requests with automatic token handling
export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  requireAuth = false
) => {
  const headers = { ...options.headers };
  
  if (requireAuth) {
    // Get current user token from Firebase Auth
    const { auth } = await import('./firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      (headers as any).Authorization = `Bearer ${token}`;
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Try to parse JSON error body, but fall back to status text
    const errorText = await response.text().catch(() => '');
    let errorData: any = null;
    try {
      errorData = JSON.parse(errorText || '{}');
    } catch (e) {
      errorData = null;
    }

    const serverMessage = errorData?.error || errorData?.message || errorText || response.statusText;
    const msg = `HTTP ${response.status} ${response.statusText} - ${serverMessage} (${response.url})`;
    // Log full response for easier debugging in dev
    console.error('API request failed:', { url, status: response.status, statusText: response.statusText, body: errorData || errorText });
    throw new Error(msg);
  }
  
  return response.json();
};

export default API_CONFIG;
