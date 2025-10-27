'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/contexts/TeamContext';
import { BuildingOffice2Icon, ClockIcon, UserGroupIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Loader from '@/app/components/Loader';

export default function TeamSelectionPage() {
  const router = useRouter();
  const { user, teams, setCurrentTeam, clearTeamContext, isLoading, authError } = useTeam();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle redirects based on team data
  useEffect(() => {
    if (!isLoading && !authError) {
      if (!user || !teams) {
        clearTeamContext();
        router.push('/login');
        return;
      }
      
      if (teams.length === 1) {
        setCurrentTeam(teams[0]);
        router.push('/dashboard/employee');
        return;
      }
      
      if (teams.length === 0) {
        router.push('/dashboard/employee');
        return;
      }
    }
  }, [isLoading, user, teams, authError, setCurrentTeam, clearTeamContext, router]);

  const handleTeamSelect = async (team: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verify user has access to this team
      const token = localStorage.getItem('session');
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.');
        clearTeamContext();
        router.push('/login');
        return;
      }

      // Check user-team association exists
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/userteams/myAssociation/${team.team.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          clearTeamContext();
          router.push('/login');
          return;
        } else if (response.status === 404) {
          setError('Vous n\'avez pas accès à cette équipe.');
          return;
        } else {
          setError('Erreur lors de la vérification de l\'équipe.');
          return;
        }
      }

      const result = await response.json();
      
      if (result.success) {
        // Verify the team data matches what we expect
        if (result.data.team_id === team.team.id && result.data.user_id === user?.id) {
          setCurrentTeam(team);
          router.push('/dashboard/employee');
        } else {
          setError('Données d\'équipe incohérentes. Veuillez vous reconnecter.');
          clearTeamContext();
          router.push('/login');
        }
      } else {
        setError(result.message || 'Erreur lors de la sélection de l\'équipe.');
      }
    } catch (error) {
      console.error('Error selecting team:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  if (isLoading) {
    return null; // Loader handled by LayoutWrapper
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur d&apos;authentification</h3>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button onClick={() => (clearTeamContext(), router.push('/login'))} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retour à la connexion</button>
        </div>
      </div>
    );
  }

  if (!user || !teams) {
    return null; // Loader handled by LayoutWrapper
  }

  return (
    <>
      {/* Local loader for team selection */}
      <Loader 
        isLoading={loading} 
        message="Sélection de l'équipe..."
      />
      
      <main className="p-6 sm:p-10 min-h-screen">
        {/* Header */}
        <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Decorative gradient */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-transparent opacity-80 pointer-events-none blur-3xl" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-transform hover:scale-105 duration-300">
                <BuildingOffice2Icon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                  Sélectionnez votre équipe
                </h1>
                <p className="text-gray-600 mt-1">Choisissez une équipe pour accéder à votre tableau de bord</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-6 transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="flex">
              <div className="text-red-800">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any, index: number) => (
            <button
              key={`${team.team.id}-${team.role}`}
              onClick={() => handleTeamSelect(team)}
              disabled={loading}
              className={`group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 duration-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.team.name}</h3>
                {team.team.description && <p className="text-sm text-gray-600 mb-3">{team.team.description}</p>}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
                  {team.role === 'manager' ? 'Responsable' : 'Employé'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{team.team.timezone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Limite retard: {team.team.lateness_limit} min</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Planning {team.planning_id ? 'personnalisé' : 'par défaut'}</span>
                <div className={`w-2 h-2 rounded-full ${team.planning_id ? 'bg-green-400' : 'bg-blue-400'}`}></div>
              </div>
            </button>
          ))}
        </div>

        {teams.length === 0 && (
          <div className={`text-center py-12 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune équipe trouvée</h3>
          </div>
        )}
      </main>
    </>
  );
}