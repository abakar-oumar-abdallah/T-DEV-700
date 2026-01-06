import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UpdateTeam } from '@/team/team';

interface EditTeamModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTeamModal({ team, isOpen, onClose, onSuccess }: EditTeamModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: team?.team.name || '',
    description: team?.team.description || '',
    lateness_limit: team?.team.lateness_limit || 10,
    timezone: team?.team.timezone || 'Europe/Paris',
    default_planning_id: team?.team.default_planning_id || null
  });

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

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Modifier l&apos;équipe</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}