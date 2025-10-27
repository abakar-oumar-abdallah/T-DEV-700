interface TotpResponse {
  success: boolean;
  message: string;
  data?: {
    teamId: string;
    code: string;
    expiresIn: number;
  };
  error?: string;
}

interface TotpVerifyResponse {
  success: boolean;
  message: string;
  data?: {
    teamId: string;
    isValid: boolean;
  };
  error?: string;
}

interface TotpResetResponse {
  success: boolean;
  message: string;
  data?: {
    teamId: string;
    secretExisted: boolean;
  };
  error?: string;
}

export const generateTotp = async (teamId: string): Promise<TotpResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        error: 'Authentication required'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/totp/generate/${teamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Failed to generate TOTP',
        error: errorData.message || 'Server error'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'TOTP generated successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Generate TOTP error:', error);
    return {
      success: false,
      message: 'Failed to generate TOTP',
      error: 'Network error. Please try again.'
    };
  }
};

export const verifyTotp = async (teamId: string, code: string): Promise<TotpVerifyResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        error: 'Authentication required'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/totp/verify/${teamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Failed to verify TOTP',
        error: errorData.message || 'Server error'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'TOTP verified successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Verify TOTP error:', error);
    return {
      success: false,
      message: 'Failed to verify TOTP',
      error: 'Network error. Please try again.'
    };
  }
};

export const resetTeamSecret = async (teamId: string): Promise<TotpResetResponse> => {
  try {
    const token = localStorage.getItem('session');
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        error: 'Authentication required'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/totp/reset/${teamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Failed to reset team secret',
        error: errorData.message || 'Server error'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Team secret reset successfully',
      data: data.data
    };
  } catch (error) {
    console.error('Reset team secret error:', error);
    return {
      success: false,
      message: 'Failed to reset team secret',
      error: 'Network error. Please try again.'
    };
  }
};