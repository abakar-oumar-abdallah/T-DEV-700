import React, { useState } from 'react';
import { DeleteTeam } from '@/team/team';
import Modal from '../Modal';

interface DeleteTeamModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteTeamModal({ team, isOpen, onClose, onSuccess }: DeleteTeamModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!team) return;

    setLoading(true);
    setError(null);

    try {
      const result = await DeleteTeam(team.team.id);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Erreur lors de la suppression de l'équipe");
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !team) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Supprimer l'équipe"
      mode="deletion"
      maxWidth="md"
    >
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Êtes-vous sûr de vouloir supprimer l&apos;équipe <strong>{team.team.name}</strong> ?
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Attention :</strong> Cette action est irréversible. Vous ne pouvez supprimer une équipe que si elle ne contient aucun employé.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  );
}