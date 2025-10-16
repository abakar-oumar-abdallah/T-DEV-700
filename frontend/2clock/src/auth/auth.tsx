interface LoginCredentials {
  email: string;
  password: string;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  role?: string;
  permission?: string;
  phone_number?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  session?: Record<string, unknown>;
  data?: {
    user: UserData;
    token: string;
    loginTime: string;
  };
  error?: string;
}

export const LoginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await fetch(`http://localhost:3001/login`, {
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