interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  permission: 'user' | 'admin' | 'superadmin';
  phone_number?: string;
  created_at: string;
  user_team?: Array<{
    id: number;
    role: string;
    team: {
      id: number;
      name: string;
    };
  }>;
}

interface Team {
  id: number;
  name: string;
  description?: string;
  lateness_limit: number;
  timezone: string;
  created_at: string;
  memberCount: number;
  user_team?: any[];
}

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalSuperadmins: number;
  totalTeams: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  pagination?: Pagination;
}

// Get dashboard statistics (uses dedicated superadmin route)
export const getSuperadminStats = async (): Promise<ApiResponse<DashboardStats>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/superadmin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('getSuperadminStats error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Get all users (uses existing /users route)
export const getAllUsers = async (page: number = 1, limit: number = 20): Promise<ApiResponse<User[]>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/users?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('getAllUsers error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Search user by email (uses existing /users/:email route)
export const searchUserByEmail = async (email: string): Promise<ApiResponse<User>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/users/${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la recherche',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('searchUserByEmail error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Update user permission (uses dedicated superadmin route)
export const updateUserPermission = async (
  userId: number,
  permission: 'user' | 'admin' | 'superadmin'
): Promise<ApiResponse<User>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/superadmin/users/${userId}/permission`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permission })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la mise à jour des permissions',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };
  } catch (error) {
    console.error('updateUserPermission error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Delete user (uses existing /users/:id route)
export const deleteUser = async (userId: number): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la suppression',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };
  } catch (error) {
    console.error('deleteUser error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Get all teams (uses existing /teams route)
export const getAllTeams = async (page: number = 1, limit: number = 20): Promise<ApiResponse<Team[]>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/teams?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la récupération des équipes',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('getAllTeams error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};

// Delete team (uses existing /teams/:id route)
export const deleteTeam = async (teamId: number): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
    const response = await fetch(`${backendUrl}/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Erreur lors de la suppression de l\'équipe',
        error: errorData.message || errorData.error
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };
  } catch (error) {
    console.error('deleteTeam error:', error);
    return {
      success: false,
      message: 'Erreur réseau',
      error: 'Network error. Please try again.'
    };
  }
};