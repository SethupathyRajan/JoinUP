import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  department: string;
  year: number;
  rollNumber: string;
  registerNumber: string;
  phoneNumber?: string;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      // Verify with backend to get user data immediately
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.data.user);
        setIsAdmin(data.data.isAdmin);
        toast.success('Logged in successfully!');
      } else {
        throw new Error('Failed to verify user data');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Login failed');
      }
      
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      console.log('Registering user with data:', userData);
      
      // Register with backend (which handles Firebase user creation)
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration error details:', errorData);
        
        if (errorData.details && Array.isArray(errorData.details)) {
          // Show specific validation errors
          throw new Error(`Validation failed: ${errorData.details.join(', ')}`);
        } else {
          throw new Error(errorData.error || 'Registration failed');
        }
      }
      
      toast.success('Account created successfully! Please login to continue.');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password change failed');
      }
      
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reset email');
      }
      
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password reset failed');
      }
      
      toast.success('Password reset successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        
        // Notify backend of logout
        await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
      }
      
      await signOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Verify token with backend and get user data
          const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN, {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCurrentUser(data.data.user);
            setIsAdmin(data.data.isAdmin);
          } else {
            // Token invalid, sign out
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error verifying user token:', error);
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};