import { Hackathon } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export const hackathonService = {
  // Get all hackathons
  getAllHackathons: async (): Promise<Hackathon[]> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.LIST, {}, true);
    const hackathons = response.data?.hackathons || [];
    if (!hackathons || hackathons.length === 0) {
      // Return a sample hackathon for local testing
      const now = new Date();
      const sample: Hackathon = {
        id: 'sample-2',
        title: 'JoinUP Sample Hackathon',
        description: 'A sample hackathon for testing registration features.',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        maxTeamSize: 5,
        minTeamSize: 1,
        status: 'upcoming',
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
  tags: ['sample', 'test'],
        prizeMoney: 10000,
        location: 'Online',
        requirements: ['No requirement'],
        registeredTeams: 0,
        totalSlots: 100,
        category: 'General',
        difficulty: 'beginner'
      } as unknown as Hackathon;

      return [sample];
    }

    return hackathons;
  },

  // Get hackathon by ID
  getHackathon: async (id: string): Promise<Hackathon> => {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.DETAILS(id), {}, true);
      const hackathon = response.data?.hackathon;
      if (hackathon) return hackathon;
      // if response is empty, fall through to list fallback
    } catch (err) {
      // details endpoint may 404 in local env — we'll try the list fallback below
      console.debug('Hackathon details fetch failed, attempting list fallback:', err);
    }

    // Fallback: call the list endpoint and search for a matching sample id
    try {
      const listRes = await apiRequest(API_CONFIG.ENDPOINTS.HACKATHON.LIST, {}, true);
      const hackathons = listRes.data?.hackathons || [];
        if (hackathons && hackathons.length > 0) {
          const found = hackathons.find((h: Hackathon) => h.id === id);
          if (found) return found as Hackathon;
        } else {
          // if list returns empty, reuse getAllHackathons local fallback (call directly)
          const fallback = await hackathonService.getAllHackathons();
          const found = (fallback || []).find((h: Hackathon) => h.id === id);
          if (found) return found as Hackathon;
        }
    } catch (e) {
      console.debug('Fallback list fetch failed:', e);
    }

    throw new Error('Hackathon not found');
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
