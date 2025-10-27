interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  error?: string;
  session?: string;
  data?: any;
}

interface CheckAuthResponse {
  success: boolean;
  data?: {
    user: any;
    teams: any[];
  };
  message?: string;
  error?: string;
}

export const LoginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL

    const response = await fetch(`${backendUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Login failed',
        error: errorData.error || 'Invalid credentials'
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Login successful',
      session: data.session,
      data: data.data
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed',
      error: 'Network error. Please try again.'
    };
  }
};

export const CheckAuth = async (): Promise<CheckAuthResponse> => {
  try {
    const token = localStorage.getItem('session');
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/checkAuth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.message || 'Authentication failed'
        };
      }
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      return {
        success: false,
        error: errorData.message || 'Authentication failed'
      };
    }
  } catch (error) {
    console.error('CheckAuth error:', error);
    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
};