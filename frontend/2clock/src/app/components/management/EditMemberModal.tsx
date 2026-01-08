import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateUser } from '@/user/user';
import PlanningForm from '../PlanningForm';

interface EditMemberModalProps {
  member: {
    id: number;
    role: string;
    planning_id: number | null;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phonenumber?: string;
    };
  } | null;
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMember: any) => void;
}

export default function EditMemberModal({ member, teamId, isOpen, onClose, onSuccess }: EditMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        email: member.user.email,
        first_name: member.user.first_name,
        last_name: member.user.last_name
      });
      setError(null);
      setSuccess(null);
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateUser(member.user.id, {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      if (result.success) {
        const updatedMember = {
          ...member,
          user: {
            ...member.user,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name
          }
        };
        
        setSuccess(result.message || 'Employé modifié avec succès');
        
        setTimeout(() => {
          onSuccess(updatedMember);
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Erreur lors de la modification');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de la modification de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen || !member) return null;

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
          <h2 className="text-2xl font-bold text-gray-900">Modifier l&apos;employé</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Information Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Informations personnelles</h3>
            
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="employe@example.com"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dupont"
                  disabled={loading}
                />
              </div>
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
              userTeamId={member.id}
              currentPlanningId={member.planning_id}
              context="member"
              title={`Planning de ${member.user.first_name} ${member.user.last_name}`}
              onSuccess={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}