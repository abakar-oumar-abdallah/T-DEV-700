import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  context: 'member' | 'team' | 'create' | 'memberAfterCreation' | 'standalone'; 
  title?: string;
  teamData?: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  standalone?: boolean;
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

const PlanningForm = forwardRef<{ getSchedulesData: () => any }, PlanningFormProps>(({ 
  userTeamId, 
  teamId, 
  currentPlanningId, 
  context,
  title = 'Planning',
  teamData,
  onSuccess,
  onError,
  standalone = false
}, ref) => {
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

  // Expose getSchedulesData method for parent component
  useImperativeHandle(ref, () => ({
    getSchedulesData: () => {
      const enabledSchedules = schedules
        .filter(schedule => schedule.enabled)
        .map(schedule => ({
          day: schedule.day,
          time_in: schedule.time_in + ':00',
          time_out: schedule.time_out + ':00'
        }));
      return enabledSchedules;
    }
  }));

  // Load existing planning
  useEffect(() => {
    const loadPlanning = async () => {
      if (context === 'create' || context === 'memberAfterCreation' || context === 'standalone') return;
      if (!teamId) return;

      setLoading(true);
      try {
        let result;
        if (context === 'member' && userTeamId) {
          result = await GetUserTeamPlanning(userTeamId, teamId);
        } else if (context === 'team') {
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

  const handleScheduleChange = (index: number, field: keyof Schedule, value: string | boolean) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If standalone mode, don't submit (parent handles it)
    if (standalone) return;
    
    if (!teamId && context !== 'create') {
      const errorMsg = 'Team ID is required';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
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
        result = await ModifyUserTeamPlanning(userTeamId, teamId, {
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
      } else if (context === 'team') {
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
      
      } else if (context === 'memberAfterCreation' && userTeamId) {
        result = await ModifyUserTeamPlanning(userTeamId, teamId, {
          schedules: enabledSchedules
        });

        if (result?.success) {
          setSuccess('Planning créé avec succès');
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        } else {
          const errorMsg = result?.message || 'Erreur lors de la création du planning';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } 
    } catch (err: any) {
      console.error('Erreur:', err);
      const errorMsg = 'Erreur lors de la soumission du planning';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const FormWrapper = standalone ? 'div' : 'form';
  const formProps = standalone ? {} : { onSubmit: handleSubmit };

  return (
    <FormWrapper {...formProps} className="space-y-4">
      {!standalone && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}

      {error && !standalone && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && !standalone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {loading && !success && !error && !standalone ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <>
          {context === 'create' && !standalone && (
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

          {standalone && (
            <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
          )}

                   <div className="space-y-3">
            {schedules.map((schedule, index) => (
              <div key={schedule.day} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-start sm:items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {dayLabels[schedule.day]}
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0 sm:contents">
                  <div>
                    <label className="block sm:hidden text-xs text-gray-600 mb-1">Début</label>
                    <input
                      type="time"
                      value={schedule.time_in}
                      onChange={(e) => handleScheduleChange(index, 'time_in', e.target.value)}
                      disabled={!schedule.enabled}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block sm:hidden text-xs text-gray-600 mb-1">Fin</label>
                    <input
                      type="time"
                      value={schedule.time_out}
                      onChange={(e) => handleScheduleChange(index, 'time_out', e.target.value)}
                      disabled={!schedule.enabled}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!standalone && (
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
          )}
        </>
      )}
    </FormWrapper>
  );
});

PlanningForm.displayName = 'PlanningForm';

export default PlanningForm;