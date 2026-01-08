import React, { useState, useEffect } from 'react';
import { GetUserTeamPlanning, ModifyUserTeamPlanning, GetTeamPlanning, ModifyTeamPlanning, CreatePlanning } from '@/planning/planning';
import { CreateTeam } from '@/team/team';

interface Schedule {
  day: string;
  time_in: string;
  time_out: string;
  enabled: boolean;
}

interface PlanningFormProps {
  userTeamId?: number;
  teamId?: number;
  currentPlanningId?: number | null;
  context: 'member' | 'team' | 'create';
  title?: string;
  teamData?: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche'
};

export default function PlanningForm({ 
  userTeamId, 
  teamId, 
  currentPlanningId, 
  context,
  title = 'Planning',
  teamData,
  onSuccess,
  onError
}: PlanningFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDefaultPlanning, setIsDefaultPlanning] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([
    { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
    { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
  ]);

  // Load existing planning
  useEffect(() => {
    const loadPlanning = async () => {
      if (context === 'create') return;

      setLoading(true);
      try {
        let result;
        
        if (context === 'member' && userTeamId) {
          result = await GetUserTeamPlanning(userTeamId);
        } else if (context === 'team' && teamId) {
          result = await GetTeamPlanning(teamId);
        }

        if (result?.success && result.data?.planning?.schedule) {
          const loadedSchedules = result.data.planning.schedule;
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const scheduleMap = new Map(loadedSchedules.map((s: any) => [s.day, s]));

          const mappedSchedules = days.map(day => {
            const schedule = scheduleMap.get(day);
            if (schedule) {
              return {
                day,
                time_in: (schedule.time_in || '09:00:00').substring(0, 5),
                time_out: (schedule.time_out || '17:00:00').substring(0, 5),
                enabled: true
              };
            }
            return {
              day,
              time_in: '09:00',
              time_out: '17:00',
              enabled: false
            };
          });

          setSchedules(mappedSchedules);
        }
      } catch (err) {
        console.error('Error loading planning:', err);
        setError('Erreur lors du chargement du planning');
      } finally {
        setLoading(false);
      }
    };

    loadPlanning();
  }, [userTeamId, teamId, context]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const enabledSchedules = schedules
        .filter(schedule => schedule.enabled)
        .map(schedule => ({
          day: schedule.day,
          time_in: schedule.time_in + ':00',
          time_out: schedule.time_out + ':00'
        }));

      if (enabledSchedules.length === 0) {
        const errorMsg = 'Veuillez activer au moins un jour dans le planning';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setLoading(false);
        return;
      }

      let result;

      if (context === 'create' && teamData) {
        // Create planning first
        const planningResult = await CreatePlanning({
          schedules: enabledSchedules,
          is_default: isDefaultPlanning
        });

        if (!planningResult.success) {
          const errorMsg = planningResult.error || 'Erreur lors de la création du planning';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          setLoading(false);
          return;
        }

        const planningId = planningResult.data?.id || null;

        if (!planningId) {
          const errorMsg = 'Un planning est obligatoire pour créer une équipe';
          setError(errorMsg);
          if (onError) onError(errorMsg);
          setLoading(false);
          return;
        }

        // Create team with planning
        const finalTeamData = {
          ...teamData,
          default_planning_id: planningId
        };

        result = await CreateTeam(finalTeamData);
        
        if (result?.success) {
          setSuccess('Équipe créée avec succès');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        } else {
          const errorMsg = result?.message || 'Erreur lors de la création de l\'équipe';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } else if (context === 'member' && userTeamId) {
        result = await ModifyUserTeamPlanning(userTeamId, {
          schedules: enabledSchedules
        });

        if (result?.success) {
          setSuccess('Planning modifié avec succès');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        } else {
          const errorMsg = result?.message || 'Erreur lors de la modification du planning';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } else if (context === 'team' && teamId) {
        result = await ModifyTeamPlanning(teamId, {
          schedules: enabledSchedules
        });

        if (result?.success) {
          setSuccess('Planning modifié avec succès');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        } else {
          const errorMsg = result?.message || 'Erreur lors de la modification du planning';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      const errorMsg = 'Erreur lors de la modification du planning';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (index: number, field: 'time_in' | 'time_out' | 'enabled', value: string | boolean) => {
    const newSchedules = [...schedules];
    if (field === 'enabled') {
      newSchedules[index].enabled = value as boolean;
    } else {
      newSchedules[index][field] = value as string;
    }
    setSchedules(newSchedules);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {loading && !success && !error ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <>
          {context === 'create' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
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
          )}

          <div className="space-y-3">
            {schedules.map((schedule, index) => (
              <div key={schedule.day} className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-700">{dayLabels[schedule.day]}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Début</label>
                  <input
                    type="time"
                    value={schedule.time_in}
                    onChange={(e) => handleScheduleChange(index, 'time_in', e.target.value)}
                    disabled={!schedule.enabled || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fin</label>
                  <input
                    type="time"
                    value={schedule.time_out}
                    onChange={(e) => handleScheduleChange(index, 'time_out', e.target.value)}
                    disabled={!schedule.enabled || loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-blue-800 text-xs">
              Astuce : Décochez les jours de repos
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
          >
            {loading 
              ? (context === 'create' ? 'Création...' : 'Enregistrement...') 
              : (context === 'create' ? 'Créer l\'équipe' : 'Enregistrer le planning')
            }
          </button>
        </>
      )}
    </form>
  );
}