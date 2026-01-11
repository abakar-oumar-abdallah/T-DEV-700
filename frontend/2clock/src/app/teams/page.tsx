'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/contexts/TeamContext';
import { BuildingOffice2Icon, PlusIcon } from '@heroicons/react/24/outline';
import Loader from '@/app/components/Loader';
import TeamCard from '@/app/components/team/TeamCard';
import CreateTeamModal from '@/app/components/team/CreateTeamModal';
import EditTeamModal from '@/app/components/team/EditTeamModal';
import DeleteTeamModal from '@/app/components/team/DeleteTeamModal';

export default function TeamSelectionPage() {
  const router = useRouter();
  const { user, teams, setCurrentTeam, clearTeamContext, isLoading, authError, updateTeamInContext } = useTeam();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<any | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !authError) {
      if (!user || !teams) {
        clearTeamContext();
        router.push('/login');
        return;
      }
      
      if (teams.length === 1 && !(user.permission === 'admin' || user.permission === 'superadmin')) {
        setCurrentTeam(teams[0]);
        router.push('/dashboard');
        return;
      }
      
      if (teams.length === 0 && !(user.permission === 'admin' || user.permission === 'superadmin')) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, user, teams, authError, setCurrentTeam, clearTeamContext, router]);

  const handleTeamSelect = async (team: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('session');
      if (!token) {
        setError('Session expirée. Veuillez vous reconnecter.');
        clearTeamContext();
        router.push('/login');
        return;
      }

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
        if (result.data.team_id === team.team.id && result.data.user_id === user?.id) {
          setCurrentTeam(team);
          if (team.role === 'owner' || team.role === 'manager') {
            router.push('/dashboard');
          } else {
            router.push('/dashboard/clock');
          }

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

  const handleModalSuccess = () => {
    window.location.reload();
  };

  const canManageTeams = user?.permission === 'admin' || user?.permission === 'superadmin';

  if (isLoading) {
    return null;
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
    return null;
  }

  return (
    <>
      <Loader 
        isLoading={loading} 
        message="Sélection de l'équipe..."
      />
      
      <main className="p-6 sm:p-10 min-h-screen">
        {/* Header */}
        <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
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
            {canManageTeams && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Créer une équipe</span>
              </button>
            )}
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
            <TeamCard
              key={`${team.team.id}-${team.role}`}
              team={team}
              index={index}
              mounted={mounted}
              loading={loading}
              canManage={team.role === 'manager' && canManageTeams}
              onSelect={handleTeamSelect}
              onEdit={canManageTeams ? setEditingTeam : undefined}
              onDelete={canManageTeams ? setDeleteConfirmTeam : undefined}
              setCurrentTeam={setCurrentTeam}
            />
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

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditTeamModal
        team={editingTeam}
        isOpen={!!editingTeam}
        onClose={() => setEditingTeam(null)}
        onSuccess={handleModalSuccess}
      />

      <DeleteTeamModal
        team={deleteConfirmTeam}
        isOpen={!!deleteConfirmTeam}
        onClose={() => setDeleteConfirmTeam(null)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}