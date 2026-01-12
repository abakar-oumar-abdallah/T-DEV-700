'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CheckAuth } from '@/auth/auth';
import { useRouter } from 'next/navigation';


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
  phone_number: string;
  first_name: string;
  last_name: string;
  permission: string;
}

interface TeamContextType {
  currentTeam: Team | null;
  user: User | null;
  setUser: (user: User | null) => void;
  teams: Team[];
  setCurrentTeam: (team: Team) => void;
  updateTeamInContext: (teamId: number, updatedData: Partial<Team['team']>) => void;
  deleteCurrentTeamRefresh: () => void;
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
  const router = useRouter();
  

  const clearTeamContext = () => {
    setCurrentTeamState(null);
    setUser(null);
    setTeams([]);
    setAuthError(null);
  };

  const deleteCurrentTeamRefresh = () => {
    setCurrentTeamState(null);
    setTeams(prevTeams => prevTeams.filter(team => team.team.id !== currentTeam?.team.id));

    localStorage.removeItem('currentTeam');
    
    const savedTeams = localStorage.getItem('userTeams');
    if (savedTeams) {
      const parsedTeams = JSON.parse(savedTeams);
      const updatedTeams = parsedTeams.filter((team: Team) => team.team.id !== deletedTeamId);
      localStorage.setItem('userTeams', JSON.stringify(updatedTeams));
    }
  }

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const result = await CheckAuth();
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setTeams(result.data.teams);

        // Redirection automatique pour superadmin
        if (result.data.user.permission === 'superadmin') {
          router.push('/dashboard/superadmin');
          return;
        }

        if (result.data.teams.length === 1) {
          const team = result.data.teams[0];
          setCurrentTeam(team);
          const isEmployee = team.role === 'employee' && result.data.user.permission === 'user';
          const redirectPath = isEmployee ? '/dashboard/clock' : '/dashboard';
          router.push(redirectPath);
          return;
        }

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
  }, []);

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
  }, [refreshAuth]);

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team);
    localStorage.setItem('currentTeam', JSON.stringify(team));
  };

  const updateTeamInContext = (teamId: number, updatedData: Partial<Team['team']>) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.team.id === teamId 
          ? { ...team, team: { ...team.team, ...updatedData } }
          : team
      )
    );

    if (currentTeam?.team.id === teamId) {
      const updatedTeam = { ...currentTeam, team: { ...currentTeam.team, ...updatedData } };
      setCurrentTeamState(updatedTeam);
      localStorage.setItem('currentTeam', JSON.stringify(updatedTeam));
    }

    const savedTeams = localStorage.getItem('userTeams');
    if (savedTeams) {
      const parsedTeams = JSON.parse(savedTeams);
      const updatedTeams = parsedTeams.map((team: Team) =>
        team.team.id === teamId
          ? { ...team, team: { ...team.team, ...updatedData } }
          : team
      );
      localStorage.setItem('userTeams', JSON.stringify(updatedTeams));
    }
  };

  const value: TeamContextType = {
    currentTeam,
    user,
    setUser,
    teams,
    setCurrentTeam,
    updateTeamInContext,
    deleteCurrentTeamRefresh,
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