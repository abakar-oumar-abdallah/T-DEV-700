import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UpdateTeam } from '@/team/team';
import PlanningForm from '../PlanningForm';

interface EditTeamModalProps {
  team: {
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

  // Timezones states
  const [timezones, setTimezones] = useState<string[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(false);

  useEffect(() => {
    if (team && isOpen) {
      setFormData({
        name: team.team.name,
        description: team.team.description || '',
        lateness_limit: team.team.lateness_limit,
        timezone: team.team.timezone
      });
      setError(null);
      setSuccess(null);
    }
  }, [team, isOpen]);

  // Load timezones
  useEffect(() => {
    const fetchTimezones = async () => {
      setTimezonesLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/timezones`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setTimezones(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching timezones:', error);
      } finally {
        setTimezonesLoading(false);
      }
    };

    if (isOpen) {
      fetchTimezones();
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
        setSuccess('Équipe modifiée avec succès');
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Erreur lors de la modification');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de la modification de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen || !team) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 rounded-t-2xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Modifier l&apos;équipe</h2>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;équipe *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Équipe Dev"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description de l'équipe"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite de retard (minutes) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.lateness_limit}
                  onChange={(e) => setFormData({ ...formData, lateness_limit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire *</label>
                {timezonesLoading ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Chargement des fuseaux horaires...
                  </div>
                ) : timezones.length > 0 ? (
                  <select
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
                >
                  {loading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>

            {/* Planning Section */}
            <div className="p-6 pt-0 border-t border-gray-200">
              <PlanningForm
                teamId={team.team.id}
                currentPlanningId={team.team.default_planning_id ? parseInt(team.team.default_planning_id) : null}
                context="team"
                title={`Planning de ${team.team.name}`}
                onSuccess={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}