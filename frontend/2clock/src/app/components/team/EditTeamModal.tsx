import React, { useState, useEffect } from 'react';
import { UpdateTeam } from '@/team/team';
import PlanningForm from '../PlanningForm';
import Modal from '../Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier l'équipe"
      mode="update"
      maxWidth="md"
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Fuseau horaire *
            </label>
            {timezonesLoading ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Chargement des fuseaux horaires...
              </div>
            ) : timezones.length > 0 ? (
              <select
                id="timezone"
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
                id="timezone"
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
        <div className="border-t border-gray-200 pt-6">
          <PlanningForm
            teamId={team.team.id}
            currentPlanningId={team.team.default_planning_id ? parseInt(team.team.default_planning_id) : null}
            context="team"
            title={`Planning de ${team.team.name}`}
            onSuccess={() => {}}
          />
        </div>
      </div>
    </Modal>
  );
}