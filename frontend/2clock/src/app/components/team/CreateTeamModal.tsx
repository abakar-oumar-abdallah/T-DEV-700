import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateTeam } from '@/team/team';
import { GetDefaultPlannings, CreatePlanning } from '@/planning/planning';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
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

  useEffect(() => {
    const loadDefaultPlannings = async () => {
      if (isOpen && defaultPlannings.length === 0) {
        setPlanningsLoading(true);
        const result = await GetDefaultPlannings();
        if (result.success && result.data) {
          setDefaultPlannings(result.data);
        }
        setPlanningsLoading(false);
      }
    };
    loadDefaultPlannings();
  }, [isOpen, defaultPlannings.length]);

  const handleSubmit = async (e: React.FormEvent) => {
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
          onSuccess();
          onClose();
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

  const handleClose = () => {
    setCreateError(null);
    setCreateSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Créer une équipe</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={handleClose}
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
  );
}