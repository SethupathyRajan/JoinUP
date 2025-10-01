import { Hackathon } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export const hackathonService = {
  // Get all hackathons
  getAllHackathons: async (): Promise<Hackathon[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.LIST, {}, true);
    return response.data?.hackathons || [];
  },

  // Get hackathon by ID
  getHackathon: async (id: string): Promise<Hackathon> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.DETAILS(id), {}, true);
    return response.data?.hackathon;
  },

  // Create hackathon (admin only)
  createHackathon: async (hackathonData: Partial<Hackathon>): Promise<Hackathon> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hackathonData),
    }, true);
    return response.data;
  },

  // Update hackathon (admin only)
  updateHackathon: async (id: string, hackathonData: Partial<Hackathon>): Promise<Hackathon> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.UPDATE(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hackathonData),
    }, true);
    return response.data;
  },

  // Delete hackathon (admin only)
  deleteHackathon: async (id: string): Promise<void> => {
    await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.DELETE(id), {
      method: 'DELETE',
    }, true);
  },
};
