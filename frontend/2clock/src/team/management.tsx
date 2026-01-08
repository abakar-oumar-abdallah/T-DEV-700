interface TeamMember {
  id: number;
  role: string;
  planning_id: number | null;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phonenumber?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Get all members of a team
 */
export const getTeamMembers = async (teamId: string): Promise<ApiResponse<TeamMember[]>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKENDURL}/teams/${teamId}/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: errorData.message || 'Erreur lors de la récupération des membres',
        error: errorData.error || 'Failed to fetch team members'
      };
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } else {
      return {
        success: false,
        message: result.message || 'Erreur lors de la récupération des membres',
        error: result.error
      };
    }
  } catch (error) {
    console.error('getTeamMembers error:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

export type { TeamMember, ApiResponse };