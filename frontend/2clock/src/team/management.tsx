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

interface AddExistingUserToTeamData {
  email: string;
  teamId: string;
  role: string;
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

/**
 * Add an existing user to a team by email
 */
export const addExistingUserToTeam = async (
  data: AddExistingUserToTeamData
): Promise<ApiResponse<any>> => {
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
      `${process.env.NEXT_PUBLIC_BACKENDURL}/userteams/email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          teamId: data.teamId,
          role: data.role
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        message: result.message || 'Erreur lors de l\'ajout de l\'utilisateur existant',
        error: result.error
      };
    }

    return {
      success: true,
      message: result.message || 'Utilisateur ajouté à l\'équipe avec succès',
      data: result.data
    };
  } catch (error) {
    console.error('Erreur addExistingUserToTeam:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

/**
 * Update user's role in a team
 */
export const updateUserTeamRole = async (
  userId: string,
  teamId: string,
  role: string
): Promise<ApiResponse<any>> => {
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
      `${process.env.NEXT_PUBLIC_BACKENDURL}/userteams/${userId}/${teamId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      }
    );

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: result.message || 'Rôle mis à jour avec succès',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || 'Erreur lors de la mise à jour du rôle',
        error: result.error
      };
    }
  } catch (error) {
    console.error('updateUserTeamRole error:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

export type { TeamMember, ApiResponse };