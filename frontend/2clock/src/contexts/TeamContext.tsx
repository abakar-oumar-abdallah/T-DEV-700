'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Team {
  id: string;
  role: string;
  planning_id?: string;
  team: {
    id: number;
    name: string;
    description?: string;
    lateness_limit: number;
    timezone: string;
    default_planning_id?: string;
  };
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  permission: string;
}

interface AuthData {
  user: User;
  teams: Team[];
  teamsCount: number;
  authenticated: boolean;
}

interface TeamContextType {
  currentTeam: Team | null;
  user: User | null;
  teams: Team[];
  setCurrentTeam: (team: Team) => void;
  clearTeamContext: () => void;
  checkAuth: () => Promise<AuthData | null>;
  initializeContext: (userData: User, teamsData: Team[]) => void;
  isLoading: boolean;
  authError: string | null;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load team context from localStorage on mount
  useEffect(() => {
    const loadTeamContext = () => {
      try {
        const savedTeam = localStorage.getItem('currentTeam');
        const savedUser = localStorage.getItem('user');
        const savedTeams = localStorage.getItem('userTeams');

        if (savedTeam) {
          setCurrentTeamState(JSON.parse(savedTeam));
        }
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        if (savedTeams) {
          setTeams(JSON.parse(savedTeams));
        }
      } catch (error) {
        console.error('Error loading team context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamContext();
  }, []);

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    localStorage.setItem('currentTeam', JSON.stringify(team));
  };

  const clearTeamContext = () => {
    setCurrentTeamState(null);
    setUser(null);
    setTeams([]);
    setAuthError(null);
    localStorage.removeItem('currentTeam');
    localStorage.removeItem('user');
    localStorage.removeItem('userTeams');
    localStorage.removeItem('session');
    localStorage.removeItem('userPrenom');
    localStorage.removeItem('userNom');
  };

  // Function to initialize context with auth data
  const initializeContext = (userData: User, teamsData: Team[]) => {
    setUser(userData);
    setTeams(teamsData);
    setAuthError(null);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userTeams', JSON.stringify(teamsData));
    localStorage.setItem('userPrenom', userData.first_name);
    localStorage.setItem('userNom', userData.last_name);
  };

  // CheckAuth function integrated into context
  const checkAuth = async (): Promise<AuthData | null> => {
    try {
      setAuthError(null);
      const token = localStorage.getItem('session');
      
      if (!token) {
        setAuthError('No authentication token found');
        return null;
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
          // Automatically initialize context with the auth data
          initializeContext(result.data.user, result.data.teams);
          
          return {
            user: result.data.user,
            teams: result.data.teams,
            teamsCount: result.data.teamsCount,
            authenticated: result.data.authenticated
          };
        } else {
          setAuthError(result.message || 'Authentication failed');
          return null;
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        setAuthError(errorData.message || 'Authentication failed');
        return null;
      }
    } catch (error) {
      console.error('CheckAuth error:', error);
      setAuthError('Network error. Please try again.');
      return null;
    }
  };

  const value: TeamContextType = {
    currentTeam,
    user,
    teams,
    setCurrentTeam,
    clearTeamContext,
    checkAuth,
    initializeContext,
    isLoading,
    authError,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}