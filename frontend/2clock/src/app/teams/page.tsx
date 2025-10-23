'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/contexts/TeamContext';
import { BuildingOffice2Icon, ClockIcon, UserGroupIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';
import EmployeeSidebar from '@/app/components/EmployeeSidebar';

export default function TeamSelectionPage() {
  const router = useRouter();
  const { user, teams, setCurrentTeam, clearTeamContext, isLoading, authError } = useTeam();
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const handleTeamSelect = (team: any) => {
    setLoading(true);
    setCurrentTeam(team);
    router.push('/dashboard/employee');
  };

  const getRoleColor = (role: string) => role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="flex">
        <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className={`${mobileOpen ? 'block' : 'hidden'} fixed inset-0 bg-black/40 z-40 sm:hidden`} onClick={() => setMobileOpen(false)} />
        
        <div className="flex-1">
          <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md" style={{ color: 'var(--color-secondary)' }}>
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="text-lg font-semibold text-gray-800">Sélectionner une équipe</div>
            <div />
          </header>

          <main className="p-6 sm:p-10">
            <div className="bg-white rounded-lg shadow p-6 mb-8 text-center">
              <div className="p-4 rounded-full mb-4 mx-auto w-fit" style={{ background: 'rgba(236,77,54,0.08)' }}>
                <BuildingOffice2Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h1 className="text-3xl font-bold mb-2">Sélectionnez votre équipe</h1>
              <p className="text-gray-600 mb-4">Choisissez une équipe pour accéder à votre tableau de bord</p>
              {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div> */}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team: any) => (
                <button
                  key={`${team.team.id}-${team.role}`}
                  onClick={() => handleTeamSelect(team)}
                  disabled={loading}
                  className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.team.name}</h3>
                    {team.team.description && <p className="text-sm text-gray-600 mb-3">{team.team.description}</p>}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
                      {team.role === 'manager' ? 'Manager' : 'Employé'}
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
              <div className="text-center py-12">
                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune équipe trouvée</h3>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}