import React, { useState } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { removeUserFromTeam } from '@/user/user';

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
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-red-600 px-8 pt-8 pb-6 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Supprimer le membre</h2>
            <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
            </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 px-8 pb-8 pt-8">
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
      </div>
      </div>
    </div>
  );
}