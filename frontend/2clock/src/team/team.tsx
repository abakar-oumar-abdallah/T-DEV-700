interface CreateTeamData {
  name: string;
  description: string;
  lateness_limit: number;
  timezone: string;
  default_planning_id?: number | null;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
  lateness_limit?: number;
  timezone?: string;
}

interface CreateTeamResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

interface UpdateTeamResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}

interface DeleteTeamResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const CreateTeam = async (teamData: CreateTeamData): Promise<CreateTeamResponse> => {
  try {
    const token = localStorage.getItem('session');

    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

    const response = await fetch(`${backendUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Team creation failed',
        error: errorData.message || errorData.error || 'Failed to create team'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Team created successfully',
      data: data.data || data
    };
  } catch (error) {
    console.error('CreateTeam error:', error);
    return {
      success: false,
      message: 'Team creation failed',
      error: 'Network error. Please try again.'
    };
  }
};

export const UpdateTeam = async (teamId: number, teamData: UpdateTeamData): Promise<UpdateTeamResponse> => {
  try {
    const token = localStorage.getItem('session');

    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

    const response = await fetch(`${backendUrl}/teams/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Team update failed',
        error: errorData.message || errorData.error || 'Failed to update team'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Team updated successfully',
      data: data.data || data
    };
  } catch (error) {
    console.error('UpdateTeam error:', error);
    return {
      success: false,
      message: 'Team update failed',
      error: 'Network error. Please try again.'
    };
  }
};

export const DeleteTeam = async (teamId: number): Promise<DeleteTeamResponse> => {
  try {
    const token = localStorage.getItem('session');

    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

    const response = await fetch(`${backendUrl}/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Team deletion failed',
        error: errorData.message || errorData.error || 'Failed to delete team'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Team deleted successfully'
    };
  } catch (error) {
    console.error('DeleteTeam error:', error);
    return {
      success: false,
      message: 'Team deletion failed',
      error: 'Network error. Please try again.'
    };
  }
};
