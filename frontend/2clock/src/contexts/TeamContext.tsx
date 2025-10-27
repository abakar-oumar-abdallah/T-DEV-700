'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CheckAuth } from '@/auth/auth';

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
  phonenumber: string;
  first_name: string;
  last_name: string;
  permission: string;
  phonenumber: string;
}

interface TeamContextType {
  currentTeam: Team | null;
  user: User | null;
  teams: Team[];
  setCurrentTeam: (team: Team) => void;
  clearTeamContext: () => void;
  isLoading: boolean;
  authError: string | null;
  refreshAuth: () => Promise<void>;
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

  const clearTeamContext = () => {
    setCurrentTeamState(null);
    setUser(null);
    setTeams([]);
    setAuthError(null);

  };

  const refreshAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const result = await CheckAuth();
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setTeams(result.data.teams);

      } else {
        setAuthError(result.error || 'Authentication failed');
        clearTeamContext();
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setAuthError('Failed to verify authentication');
      clearTeamContext();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load saved data first
        const savedTeam = localStorage.getItem('currentTeam');
        const savedUser = localStorage.getItem('user');
        const savedTeams = localStorage.getItem('userTeams');

        if (savedTeam) setCurrentTeamState(JSON.parse(savedTeam));
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedTeams) setTeams(JSON.parse(savedTeams));

        refreshAuth()
        const session = localStorage.getItem('session');
        if (session) {
          await refreshAuth();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading team context:', error);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []); 

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    localStorage.setItem('currentTeam', JSON.stringify(team));
  };

  const value: TeamContextType = {
    currentTeam,
    user,
    teams,
    setCurrentTeam,
    clearTeamContext,
    isLoading,
    authError,
    refreshAuth,
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