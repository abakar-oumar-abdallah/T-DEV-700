import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CreateTeam } from '@/team/team';
import { CreatePlanning } from '@/planning/planning';
import PlanningForm from '../PlanningForm';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lateness_limit: 10,
    timezone: 'Europe/Paris'
  });

  // Timezones states
  const [timezones, setTimezones] = useState<string[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(false);

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

  const handleClose = () => {
    setCreateError(null);
    setCreateSuccess(null);
    setFormData({
      name: '',
      description: '',
      lateness_limit: 10,
      timezone: 'Europe/Paris'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 16px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Créer une équipe</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Team Information Form */}
          <div className="space-y-4">
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
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              )}
            </div>
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

          {/* Planning Form Component */}
          <div className="border-t border-gray-200 pt-6">
            <PlanningForm
              context="create"
              title="Planning par défaut de l'équipe"
              teamData={formData}
              onSuccess={() => {
                setCreateSuccess('Équipe créée avec succès !');
                setTimeout(() => {
                  onSuccess();
                  handleClose();
                }, 1500);
              }}
              onError={(error) => setCreateError(error)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={createLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}