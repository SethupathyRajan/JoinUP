import { Registration } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

interface RegistrationData {
  hackathonId: string;
  teamName?: string;
  teamMembers: string[];
}

export const registrationService = {
  // Register for hackathon
  registerForHackathon: async (registrationData: RegistrationData): Promise<Registration> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTRATION.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    }, true);
    return response.data;
  },

  // Get user's registrations
  getRegistrations: async (): Promise<Registration[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTRATION.LIST, {}, true);
    return response.data?.registrations || [];
  },

  // Alias for getUserRegistrations (used in Profile page)
  getUserRegistrations: async (): Promise<Registration[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTRATION.LIST, {}, true);
    return response.data?.registrations || [];
  },

  // Get registration details
  getRegistration: async (id: string): Promise<Registration> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTRATION.DETAILS(id), {}, true);
    return response.data;
  },

  // Update registration status (admin only)
  updateRegistrationStatus: async (id: string, status: string): Promise<Registration> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTRATION.UPDATE_STATUS(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }, true);
    return response.data;
  },

  // Download certificate
  downloadCertificate: async (id: string): Promise<Blob> => {
    const response = await fetch(API_CONFIG.ENDPOINTS.REGISTRATION.DOWNLOAD_CERTIFICATE(id), {
      headers: {
        'Authorization': `Bearer ${await (await import('../config/firebase')).auth.currentUser?.getIdToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to download certificate');
    }
    
    return response.blob();
  },
};
