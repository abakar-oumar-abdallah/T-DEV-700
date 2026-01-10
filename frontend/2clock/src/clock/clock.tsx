interface ClockInOutRequest {
  totp?: string;
  code?: string;
  teamId?: string;
}

interface ClockInOutResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    user_team_id: number;
    arrival_time?: string;
    departure_time?: string;
    planning_id?: string;
    work_day?: string;
    status: 'clocked_in' | 'clocked_out';
  } | Array<{
    id: string;
    user_team_id: number;
    arrival_time?: string;
    departure_time?: string;
    planning_id?: string;
    work_day?: string;
    status: 'clocked_in' | 'clocked_out';
  }>;
  warnings?: string[];
  isLate?: boolean;
  lateBy?: number;
  earlyBy?: number;
  overtimeBy?: number;
  errorCode?: string;
  error?: string;
}

const ERROR_MESSAGES: { [key: string]: string } = {
  'ERR_MISSING_USER_TEAM_ID': 'Identifiant d\'équipe manquant',
  'ERR_USER_TEAM_NOT_FOUND': 'Association utilisateur-équipe non trouvée',
  'ERR_NO_PLANNING_FOUND': 'Aucun planning trouvé pour cette équipe',
  'ERR_NO_SCHEDULE_FOR_DAY': 'Aucun horaire programmé pour ce jour',
  'ERR_MULTIPLE_CLOCK_SAME_DAY': 'Vous avez déjà pointé pour cette journée de travail',
  'ERR_INCORRECT_TOTP': 'Code de validation incorrect ou expiré',
  'ERR_TOTP_REQUIRED': 'Code de validation requis',
  'ERR_TOTP_EXPIRED': 'Code de validation expiré',
  'ERR_DATABASE_ERROR': 'Erreur de base de données',
  'ERR_INTERNAL_ERROR': 'Erreur interne du serveur'
};

// Messages d'erreur communs en anglais à traduire
const ENGLISH_ERROR_PATTERNS: { [key: string]: string } = {
  'Invalid TOTP code': 'Code de validation incorrect',
  'TOTP code verification failed': 'Échec de la vérification du code',
  'Invalid or expired TOTP code': 'Code de validation incorrect ou expiré',
  'The provided TOTP code is incorrect or expired': 'Le code de validation fourni est incorrect ou expiré',
  'TOTP code must be exactly 6 digits': 'Le code de validation doit contenir exactement 6 chiffres',
  'TOTP code is required': 'Code de validation requis'
};

// Fonction pour nettoyer les warnings en supprimant les parties anglaises
const cleanWarnings = (warnings?: string[]): string[] => {
  if (!warnings) return [];
  
  return warnings.map(warning => {
    // Supprimer les parties entre parenthèses qui contiennent du texte anglais
    let cleaned = warning.replace(/\s*\([^)]*(?:scheduled|minutes|early|late|overtime)[^)]*\)/gi, '');
    
    // Nettoyer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }).filter(warning => warning.length > 0); // Enlever les warnings vides
};

// Fonction pour traduire les messages d'erreur anglais
const translateErrorMessage = (message: string): string => {
  // Vérifier d'abord les patterns d'erreur anglais
  for (const [englishPattern, frenchTranslation] of Object.entries(ENGLISH_ERROR_PATTERNS)) {
    if (message.toLowerCase().includes(englishPattern.toLowerCase())) {
      return frenchTranslation;
    }
  }
  
  return message;
};

export const clockInOut = async (teamId: string, request: ClockInOutRequest): Promise<ClockInOutResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/clocks/myTeam/${teamId}/clockInOut`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      
      // Translate error message if errorCode exists, otherwise translate common English errors
      const translatedMessage = errorData.errorCode && ERROR_MESSAGES[errorData.errorCode] 
        ? ERROR_MESSAGES[errorData.errorCode]
        : translateErrorMessage(errorData.message || 'Clock in/out failed');

      return {
        success: false,
        message: translatedMessage,
        errorCode: errorData.errorCode,
        error: errorData.error || errorData.message || 'Unknown error'
      };
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Clock in/out successful',
        data: data.data,
        warnings: cleanWarnings(data.warnings), // Nettoyer les warnings
        isLate: data.isLate,
        lateBy: data.lateBy,
        earlyBy: data.earlyBy,
        overtimeBy: data.overtimeBy
      };
    } else {
      // Translate error message if errorCode exists, otherwise translate common English errors
      const translatedMessage = data.errorCode && ERROR_MESSAGES[data.errorCode] 
        ? ERROR_MESSAGES[data.errorCode]
        : translateErrorMessage(data.message || 'Clock in/out failed');

      return {
        success: false,
        message: translatedMessage,
        errorCode: data.errorCode,
        error: data.error
      };
    }
  } catch (error) {
    console.error('Clock in/out error:', error);
    return {
      success: false,
      message: 'Erreur de connexion. Veuillez réessayer.',
      error: 'Network error. Please try again.'
    };
  }
};

// Les autres fonctions restent identiques...
export const getClockHistory = async (teamId: string, date?: string): Promise<ClockInOutResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const endpoint = date 
      ? `${process.env.NEXT_PUBLIC_BACKENDURL}/clocks/myTeam/${teamId}/date/${date}`
      : `${process.env.NEXT_PUBLIC_BACKENDURL}/clocks/users/myClocks`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: errorData.message || 'Failed to fetch clock history',
        error: errorData.error || errorData.message || 'Unknown error'
      };
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Clock history retrieved successfully',
        data: data.data
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch clock history',
        error: data.error
      };
    }
  } catch (error) {
    console.error('Clock history error:', error);
    return {
      success: false,
      message: 'Failed to fetch clock history',
      error: 'Network error. Please try again.'
    };
  }
};

export const getClocksByDateRange = async (teamId: string, startDate: string, endDate: string): Promise<ClockInOutResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/clocks/myTeam/${teamId}/range/${startDate}/${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: errorData.message || 'Failed to fetch clock history',
        error: errorData.error || errorData.message || 'Unknown error'
      };
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Clock history retrieved successfully',
        data: data.data
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to fetch clock history',
        error: data.error
      };
    }
  } catch (error) {
    console.error('Clock history error:', error);
    return {
      success: false,
      message: 'Failed to fetch clock history',
      error: 'Network error. Please try again.'
    };
  }
};
