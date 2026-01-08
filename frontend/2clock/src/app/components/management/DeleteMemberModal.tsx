import React, { useState } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { removeUserFromTeam } from '@/user/user';
import Modal from '../Modal';
interface DeleteMemberModalProps {
  member: {
    id: number;
    role: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    };
  } | null;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteMemberModal({ member, teamId, isOpen, onClose, onSuccess }: DeleteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!member) return;

    setLoading(true);
    setError(null);

    try {
      const result = await removeUserFromTeam(member.user.id, teamId);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Supprimer le membre"
      mode="deletion"
      maxWidth="md"
    >
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong>{member.user.first_name} {member.user.last_name}</strong> de l&apos;équipe ?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Attention :</strong> Cette action est irréversible.
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