'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/contexts/TeamContext';
import { BuildingOffice2Icon, ClockIcon, UserGroupIcon, ChevronRightIcon, PlusIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Loader from '@/app/components/Loader';
import { CreateTeam, UpdateTeam, DeleteTeam } from '@/team/team';
import { GetDefaultPlannings, CreatePlanning } from '@/planning/planning';

export default function TeamSelectionPage() {
  const router = useRouter();
  const { user, teams, setCurrentTeam, clearTeamContext, isLoading, authError } = useTeam();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [defaultPlannings, setDefaultPlannings] = useState<any[]>([]);
  const [planningsLoading, setPlanningsLoading] = useState(false);
  const [planningMode, setPlanningMode] = useState<'existing' | 'custom'>('existing');
  const [isDefaultPlanning, setIsDefaultPlanning] = useState(false);
  const [customSchedules, setCustomSchedules] = useState<Array<{ day: string; time_in: string; time_out: string; enabled: boolean }>>([
    { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
    { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lateness_limit: 10,
    timezone: 'Europe/Paris',
    default_planning_id: null as number | null
  });
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<any | null>(null);
  
  // Handle mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load default plannings when modal opens
  useEffect(() => {
    const loadDefaultPlannings = async () => {
      if (showCreateModal && defaultPlannings.length === 0) {
        setPlanningsLoading(true);
        const result = await GetDefaultPlannings();
        if (result.success && result.data) {
          setDefaultPlannings(result.data);
        }
        setPlanningsLoading(false);
      }
    };
    loadDefaultPlannings();
  }, [showCreateModal, defaultPlannings.length]);

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
        router.push('/dashboard');
        return;
      }
      
      if (teams.length === 0) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, user, teams, authError, setCurrentTeam, clearTeamContext, router]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      let planningId = formData.default_planning_id;

      if (planningMode === 'existing' && !planningId) {
        setCreateError('Vous devez sélectionner un planning existant ou créer un planning personnalisé');
        setCreateLoading(false);
        return;
      }

      if (planningMode === 'custom') {
        const enabledSchedules = customSchedules
          .filter(schedule => schedule.enabled)
          .map(schedule => ({
            day: schedule.day,
            time_in: schedule.time_in + ':00',
            time_out: schedule.time_out + ':00'
          }));

        if (enabledSchedules.length === 0) {
          setCreateError('Veuillez activer au moins un jour dans le planning');
          setCreateLoading(false);
          return;
        }

        const planningResult = await CreatePlanning({
          is_default: isDefaultPlanning,
          schedules: enabledSchedules
        });

        if (!planningResult.success) {
          setCreateError(planningResult.error || 'Erreur lors de la création du planning');
          setCreateLoading(false);
          return;
        }

        planningId = planningResult.data?.id || null;
      }

      if (!planningId) {
        setCreateError('Un planning est obligatoire pour créer une équipe');
        setCreateLoading(false);
        return;
      }

      const teamData = {
        ...formData,
        default_planning_id: planningId
      };

      const result = await CreateTeam(teamData);

      if (result.success) {
        setCreateSuccess('Équipe créée avec succès !');
        setFormData({
          name: '',
          description: '',
          lateness_limit: 10,
          timezone: 'Europe/Paris',
          default_planning_id: null
        });
        setPlanningMode('existing');
        setIsDefaultPlanning(false);
        setCustomSchedules([
          { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
          { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
          { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
          { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
          { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
          { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
          { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
        ]);

        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess(null);
          window.location.reload();
        }, 1500);
      } else {
        setCreateError(result.error || "Erreur lors de la création de l'équipe");
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setCreateError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const result = await UpdateTeam(editingTeam.team.id, formData);

      if (result.success) {
        setCreateSuccess('Équipe modifiée avec succès !');
        setTimeout(() => {
          setEditingTeam(null);
          setCreateSuccess(null);
          window.location.reload();
        }, 1500);
      } else {
        setCreateError(result.error || "Erreur lors de la modification de l'équipe");
      }
    } catch (error) {
      console.error('Error updating team:', error);
      setCreateError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteConfirmTeam) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      const result = await DeleteTeam(deleteConfirmTeam.team.id);

      if (result.success) {
        setDeleteConfirmTeam(null);
        window.location.reload();
      } else {
        setCreateError(result.error || "Erreur lors de la suppression de l'équipe");
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      setCreateError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (team: any) => {
    setEditingTeam(team);
    setFormData({
      name: team.team.name,
      description: team.team.description || '',
      lateness_limit: team.team.lateness_limit,
      timezone: team.team.timezone,
      default_planning_id: team.team.default_planning_id || null
    });
  };
  
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
          router.push('/dashboard');
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
            {user?.permission === 'admin' || user?.permission === 'superadmin' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Créer une équipe</span>
              </button>
            ) : null}
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
            <div
              key={`${team.team.id}-${team.role}`}
              className={`group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                </div>
                {team.role === 'manager' && (user?.permission === 'admin' || user?.permission === 'superadmin') && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(team);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier l'équipe"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmTeam(team);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer l'équipe"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.team.name}</h3>
                {team.team.description && <p className="text-sm text-gray-600 mb-3">{team.team.description}</p>}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
                  {team.role === 'manager' ? 'Responsable' : 'Employé'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-500 mb-4">
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

              {/* Action buttons */}
              <div className={`mt-4 flex gap-2 ${team.role === 'manager' ? 'flex-col' : ''}`}>
                {team.role === 'manager' && (
                  <button
                    onClick={() => {
                      setCurrentTeam(team);
                      router.push('/dashboard/manager/team');
                    }}
                    disabled={loading}
                    className="w-full flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Voir membres</span>
                  </button>
                )}

                <button
                  onClick={() => handleTeamSelect(team)}
                  disabled={loading}
                  className="w-full flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium">Sélectionner</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
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

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Créer une équipe</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                  setCreateSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l&apos;équipe *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Équipe Dev"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description de l'équipe"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="lateness_limit" className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de retard (minutes) *
                </label>
                <input
                  type="number"
                  id="lateness_limit"
                  required
                  min="0"
                  value={formData.lateness_limit}
                  onChange={(e) => setFormData({ ...formData, lateness_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuseau horaire *
                </label>
                <select
                  id="timezone"
                  required
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planning par défaut *
                </label>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPlanningMode('existing')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      planningMode === 'existing'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    Choisir existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanningMode('custom')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      planningMode === 'custom'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    Créer personnalisé
                  </button>
                </div>

                {planningMode === 'existing' ? (
                  planningsLoading ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Chargement des plannings...
                    </div>
                  ) : (
                    <select
                      id="default_planning"
                      value={formData.default_planning_id || ''}
                      onChange={(e) => setFormData({ ...formData, default_planning_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Sélectionnez un planning *</option>
                      {defaultPlannings.map((planning) => (
                        <option key={planning.id} value={planning.id}>
                          Planning #{planning.id} {planning.schedules && `(${planning.schedules.length} jours)`}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="is_default_planning"
                        checked={isDefaultPlanning}
                        onChange={(e) => setIsDefaultPlanning(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="is_default_planning" className="text-sm font-medium text-blue-900 cursor-pointer">
                        Marquer comme planning par défaut
                      </label>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">Configurez les horaires pour chaque jour :</p>
                      {customSchedules.map((schedule, index) => (
                        <div key={schedule.day} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => {
                              const newSchedules = [...customSchedules];
                              newSchedules[index].enabled = e.target.checked;
                              setCustomSchedules(newSchedules);
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm font-medium w-20 capitalize">{schedule.day}</span>
                          {schedule.enabled && (
                            <>
                              <input
                                type="time"
                                value={schedule.time_in}
                                onChange={(e) => {
                                  const newSchedules = [...customSchedules];
                                  newSchedules[index].time_in = e.target.value;
                                  setCustomSchedules(newSchedules);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={schedule.time_out}
                                onChange={(e) => {
                                  const newSchedules = [...customSchedules];
                                  newSchedules[index].time_out = e.target.value;
                                  setCustomSchedules(newSchedules);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{createSuccess}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setCreateSuccess(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={createLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Modifier l&apos;équipe</h2>
              <button
                onClick={() => {
                  setEditingTeam(null);
                  setCreateError(null);
                  setCreateSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditTeam} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l&apos;équipe *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="edit-lateness" className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de retard (minutes) *
                </label>
                <input
                  type="number"
                  id="edit-lateness"
                  required
                  min="0"
                  value={formData.lateness_limit}
                  onChange={(e) => setFormData({ ...formData, lateness_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuseau horaire *
                </label>
                <select
                  id="edit-timezone"
                  required
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}

              {createSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{createSuccess}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam(null);
                    setCreateError(null);
                    setCreateSuccess(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={createLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTeam && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Supprimer l&apos;équipe</h2>
              <button
                onClick={() => {
                  setDeleteConfirmTeam(null);
                  setCreateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer l&apos;équipe <strong>{deleteConfirmTeam.team.name}</strong> ?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Attention :</strong> Cette action est irréversible. Vous ne pouvez supprimer une équipe que si elle ne contient aucun employé.
                </p>
              </div>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{createError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmTeam(null);
                  setCreateError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={createLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteTeam}
                disabled={createLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}