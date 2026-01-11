import { Socket } from 'socket.io-client'
import io from 'socket.io-client'

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

interface TotpData {
  teamId: string;
  code: string;
  expiresIn: number;
  timestamp: string;
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

// Socket functions
export const createTotpSocket = (teamId: string): typeof Socket => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
  
  const cleanUrl = backendUrl.replace(/\/api$/, '');

  console.log(cleanUrl)
  const socket = io(cleanUrl, {
    transports: ['websocket','polling'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
  return socket;
};


export const setupTotpSocketEvents = (
  socket: typeof Socket, 
  teamId: string,
  onTotpUpdate: (data: TotpData) => void,
  onConnect: () => void,
  onDisconnect: () => void,
  onError: (error: string) => void
): void => {
  socket.on('connect', () => {
    console.log('WebSocket connecté');
    socket.emit('join-team', teamId);
    onConnect();
  });

  socket.on('disconnect', () => {
    console.log('WebSocket déconnecté');
    onDisconnect();
  });

  socket.on(`totp:${teamId}`, (data: TotpData) => {
    console.log('Nouveau code TOTP reçu:', data);
    onTotpUpdate(data);
  });

  socket.on('connect_error', (error: any) => {
    console.error('Erreur connexion WebSocket:', error);
    onError('Connexion temps réel indisponible');
  });
};

export const disconnectTotpSocket = (socket: typeof Socket | null, teamId: string): void => {
  if (socket) {
    socket.emit('leave-team', teamId);
    socket.disconnect();
  }
};