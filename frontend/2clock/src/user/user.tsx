interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  permission: string;
}

interface AddToTeamData {
  userId: string;
  teamId: string;
  role: string;
}

interface TeamMember {
  id: number;
  role: string;
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
  message: string;
  data?: T;
  error?: string;
}

const ERROR_MESSAGES: { [key: string]: string } = {
  'ERR_USER_EXISTS': 'Cet email est déjà utilisé',
  'ERR_INVALID_EMAIL': 'Email invalide',
  'ERR_WEAK_PASSWORD': 'Mot de passe trop faible',
  'ERR_USER_NOT_FOUND': 'Utilisateur non trouvé',
  'ERR_TEAM_NOT_FOUND': 'Équipe non trouvée',
  'ERR_ALREADY_IN_TEAM': 'L\'utilisateur fait déjà partie de cette équipe',
  'ERR_PERMISSION_DENIED': 'Permission refusée',
  'ERR_DATABASE_ERROR': 'Erreur de base de données',
  'ERR_INTERNAL_ERROR': 'Erreur interne du serveur'
};

const translateErrorMessage = (message: string, errorCode?: string): string => {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  
  const translations: { [key: string]: string } = {
    'email already exists': 'Cet email est déjà utilisé',
    'invalid email format': 'Format d\'email invalide',
    'password too weak': 'Mot de passe trop faible',
    'user not found': 'Utilisateur non trouvé',
    'team not found': 'Équipe non trouvée',
    'unauthorized': 'Non autorisé',
    'permission denied': 'Permission refusée'
  };

  const lowerMessage = message.toLowerCase();
  for (const [eng, fr] of Object.entries(translations)) {
    if (lowerMessage.includes(eng)) {
      return fr;
    }
  }

  return message;
};

/**
 * Crée un nouvel utilisateur
 */
export const createUser = async (userData: CreateUserData): Promise<ApiResponse<{ id: string }>> => {
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
      `${process.env.NEXT_PUBLIC_BACKENDURL}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: translateErrorMessage(
          errorData.message || 'Erreur lors de la création de l\'utilisateur',
          errorData.errorCode
        ),
        error: errorData.error || errorData.message
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        message: data.message || 'Utilisateur créé avec succès',
        data: data.data
      };
    } else {
      return {
        success: false,
        message: translateErrorMessage(
          data.message || 'Erreur lors de la création',
          data.errorCode
        ),
        error: data.error
      };
    }
  } catch (error) {
    console.error('Erreur createUser:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

/**
 * Ajoute un utilisateur à une équipe
 */
export const addUserToTeam = async (data: AddToTeamData): Promise<ApiResponse<void>> => {
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
      `${process.env.NEXT_PUBLIC_BACKENDURL}/userteams`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: translateErrorMessage(
          errorData.message || 'Erreur lors de l\'ajout à l\'équipe',
          errorData.errorCode
        ),
        error: errorData.error || errorData.message
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Utilisateur ajouté à l\'équipe avec succès',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: translateErrorMessage(
          result.message || 'Erreur lors de l\'ajout à l\'équipe',
          result.errorCode
        ),
        error: result.error
      };
    }
  } catch (error) {
    console.error('Erreur addUserToTeam:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

/**
 * Crée un employé et l'ajoute à une équipe (fonction combinée)
 */
export const createEmployeeInTeam = async (
  userData: Omit<CreateUserData, 'permission'>,
  teamId: string
): Promise<ApiResponse<TeamMember>> => {
  try {
    // 1. Créer l'utilisateur
    const createUserResult = await createUser({
      ...userData,
      permission: 'user'
    });

    if (!createUserResult.success || !createUserResult.data?.id) {
      return {
        success: false,
        message: createUserResult.message || 'Erreur lors de la création de l\'utilisateur',
        error: createUserResult.error
      };
    }

    const newUserId = createUserResult.data.id;

    // 2. Ajouter à l'équipe
    const addToTeamResult = await addUserToTeam({
      userId: newUserId,
      teamId: teamId,
      role: 'employee'
    });

    if (!addToTeamResult.success) {
      return {
        success: false,
        message: addToTeamResult.message || 'Erreur lors de l\'ajout à l\'équipe',
        error: addToTeamResult.error
      };
    }

    // 3. Retourner le membre créé
    const newMember: TeamMember = {
      id: addToTeamResult.data ? (addToTeamResult.data as any).id : null,
      role: 'employee',
      user: {
        id: newUserId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phonenumber: userData.phone_number || undefined
      }
    };

    return {
      success: true,
      message: 'Employé créé et ajouté à l\'équipe avec succès',
      data: newMember
    };
  } catch (error) {
    console.error('Erreur createEmployeeInTeam:', error);
    return {
      success: false,
      message: 'Erreur lors de la création de l\'employé',
      error: 'Unexpected error occurred'
    };
  }
};

/**
 * Met à jour un utilisateur
 */
export const updateUser = async (
  userId: string,
  userData: Partial<Omit<CreateUserData, 'password' | 'permission'>>,
  teamId?: string
): Promise<ApiResponse<void>> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Session expirée',
        error: 'No authentication token found'
      };
    }

    // Prepare body data
    const bodyData: any = { ...userData };
    
    // Add teamId if provided (for manager/owner updates)
    if (teamId) {
      bodyData.teamId = teamId;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKENDURL}/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: translateErrorMessage(
          errorData.message || 'Erreur lors de la mise à jour de l\'utilisateur',
          errorData.errorCode
        ),
        error: errorData.error || errorData.message
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Utilisateur mis à jour avec succès',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: translateErrorMessage(
          result.message || 'Erreur lors de la mise à jour',
          result.errorCode
        ),
        error: result.error
      };
    }
  } catch (error) {
    console.error('Erreur updateUser:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};

/**
 * Supprime un utilisateur d'une équipe
 */
export const removeUserFromTeam = async (
  userId: string,
  teamId: string
): Promise<ApiResponse<void>> => {
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
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: translateErrorMessage(
          errorData.message || 'Erreur lors de la suppression de l\'utilisateur',
          errorData.errorCode
        ),
        error: errorData.error || errorData.message
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Utilisateur retiré de l\'équipe avec succès',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: translateErrorMessage(
          result.message || 'Erreur lors de la suppression',
          result.errorCode
        ),
        error: result.error
      };
    }
  } catch (error) {
    console.error('Erreur removeUserFromTeam:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      error: 'Network error. Please try again.'
    };
  }
};
