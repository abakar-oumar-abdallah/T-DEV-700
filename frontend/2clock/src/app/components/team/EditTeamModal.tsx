import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UpdateTeam } from '@/team/team';
import { CreatePlanning, GetTeamPlanning } from '@/planning/planning';

interface EditTeamModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Traduction des jours
const dayTranslations: { [key: string]: string } = {
  'monday': 'Lundi',
  'tuesday': 'Mardi',
  'wednesday': 'Mercredi',
  'thursday': 'Jeudi',
  'friday': 'Vendredi',
  'saturday': 'Samedi',
  'sunday': 'Dimanche'
};

export default function EditTeamModal({ team, isOpen, onClose, onSuccess }: EditTeamModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lateness_limit: 10,
    timezone: 'Europe/Paris'
  });

  // Planning states
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [planningSuccess, setPlanningSuccess] = useState<string | null>(null);
  const [customSchedules, setCustomSchedules] = useState<Array<{ day: string; time_in: string; time_out: string; enabled: boolean }>>([
    { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
    { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
  ]);
  const [currentPlanningLoading, setCurrentPlanningLoading] = useState(false);

  // Timezones states
  const [timezones, setTimezones] = useState<string[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(false);

  // Load team data when modal opens
  useEffect(() => {
    if (isOpen && team) {
      setFormData({
        name: team.team.name || '',
        description: team.team.description || '',
        lateness_limit: team.team.lateness_limit || 10,
        timezone: team.team.timezone || 'Europe/Paris'
      });
    }
  }, [isOpen, team]);

  // Load current team planning
  useEffect(() => {
    const loadCurrentPlanning = async () => {
      if (isOpen && team?.team?.id) {
        setCurrentPlanningLoading(true);
        try {
          const result = await GetTeamPlanning(team.team.id);
          
          console.log('Planning result:', result); // Debug log
          
          if (result.success && result.data?.planning) {
            const planning = result.data.planning;
            
            // Check both 'schedule' (array) and 'schedules' (array) properties
            const scheduleData = planning.schedule || [];
            
            console.log('Schedule data:', scheduleData); // Debug log
            
            if (scheduleData.length > 0) {
              // Map the schedules to our format
              const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const scheduleMap = new Map(scheduleData.map((s: any) => [s.day, s]));
              
              const mappedSchedules = daysOfWeek.map(day => {
                const schedule = scheduleMap.get(day);
                if (schedule) {
                  return {
                    day,
                    // Handle both time_in and arrival_time formats
                    time_in: (schedule.time_in  || '09:00:00').substring(0, 5),
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
              
              setCustomSchedules(mappedSchedules);
            }
          }
        } catch (error) {
          console.error('Error loading current planning:', error);
        } finally {
          setCurrentPlanningLoading(false);
        }
      }
    };

    if (isOpen) {
      loadCurrentPlanning();
    }
  }, [isOpen, team]);

  // Load timezones from API or localStorage
  useEffect(() => {
    const loadTimezones = async () => {
      // Check localStorage first
      const cachedTimezones = localStorage.getItem('valid_timezones');
      if (cachedTimezones) {
        setTimezones(JSON.parse(cachedTimezones));
        return;
      }

      // Fetch from API
      setTimezonesLoading(true);
      try {
        const token = localStorage.getItem('session');
        const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;
        
        const response = await fetch(`${backendUrl}/timezones`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setTimezones(result.data);
            // Cache in localStorage
            localStorage.setItem('valid_timezones', JSON.stringify(result.data));
          }
        }
      } catch (error) {
        console.error('Error loading timezones:', error);
      } finally {
        setTimezonesLoading(false);
      }
    };

    if (isOpen) {
      loadTimezones();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await UpdateTeam(team.team.id, formData);

      if (result.success) {
        setSuccess('Équipe modifiée avec succès !');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Erreur lors de la modification de l'équipe");
      }
    } catch (error) {
      console.error('Error updating team:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanningUpdate = async () => {
    if (!team) return;

    setPlanningLoading(true);
    setPlanningError(null);
    setPlanningSuccess(null);

    try {
      const enabledSchedules = customSchedules
        .filter(schedule => schedule.enabled)
        .map(schedule => ({
          day: schedule.day,
          time_in: schedule.time_in + ':00',
          time_out: schedule.time_out + ':00'
        }));

      if (enabledSchedules.length === 0) {
        setPlanningError('Veuillez activer au moins un jour dans le planning');
        setPlanningLoading(false);
        return;
      }

      const planningResult = await CreatePlanning({
        is_default: false,
        schedules: enabledSchedules
      });

      if (!planningResult.success) {
        setPlanningError(planningResult.error || 'Erreur lors de la création du planning');
        setPlanningLoading(false);
        return;
      }

      const planningId = planningResult.data?.id || null;

      if (!planningId) {
        setPlanningError('Erreur lors de la création du planning');
        setPlanningLoading(false);
        return;
      }

      // Call modify team planning endpoint
      const token = localStorage.getItem('session');
      const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

      const schedules = customSchedules
        .filter(s => s.enabled)
        .map(s => ({
          day: s.day,
          time_in: s.time_in + ':00',
          time_out: s.time_out + ':00'
        }));

      const response = await fetch(`${backendUrl}/plannings/teams/${team.team.id}/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schedules })
      });

      if (response.ok) {
        setPlanningSuccess('Planning modifié avec succès !');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        const errorData = await response.json();
        setPlanningError(errorData.message || 'Erreur lors de la modification du planning');
      }
    } catch (error) {
      console.error('Error updating planning:', error);
      setPlanningError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setPlanningLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setPlanningError(null);
    setPlanningSuccess(null);
    onClose();
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto pt-8">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 my-8 transform transition-all animate-slideUp border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Modifier l&apos;équipe</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: Informations de l'équipe */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations de l&apos;équipe</h3>
          
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
            {timezonesLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Chargement des fuseaux horaires...
              </div>
            ) : timezones.length > 0 ? (
              <select
                id="edit-timezone"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            ) : (
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
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Modification...' : 'Modifier les informations'}
            </button>
          </div>
        </form>

        {/* Section 2: Planning par défaut */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Planning par défaut de l&apos;équipe</h3>

          {currentPlanningLoading ? (
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-center">
              Chargement du planning actuel...
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 custom-scrollbar">
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
                  <span className="text-sm font-medium w-20">{dayTranslations[schedule.day]}</span>
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
          )}

          {planningError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{planningError}</p>
            </div>
          )}

          {planningSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{planningSuccess}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePlanningUpdate}
            disabled={planningLoading || currentPlanningLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {planningLoading ? 'Modification du planning...' : 'Modifier le planning'}
          </button>
        </div>
      </div>
    </div>
  );
}