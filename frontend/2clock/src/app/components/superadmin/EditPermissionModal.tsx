import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  permission: 'user' | 'admin' | 'superadmin';
}

interface EditPermissionModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, permission: 'user' | 'admin' | 'superadmin') => Promise<void>;
}

export default function EditPermissionModal({ user, isOpen, onClose, onSave }: EditPermissionModalProps) {
  const [permission, setPermission] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPermission(user.permission);
      setError(null);
      setSuccess(null);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSave(user.id, permission);
      setSuccess('Permissions mises à jour avec succès');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier les permissions"
      mode="update"
      maxWidth="md"
    >
      <div className="space-y-6">
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

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            <strong>{user.first_name} {user.last_name}</strong>
            <br />
            <span className="text-sm text-gray-600">{user.email}</span>
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau de permission
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as any)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          
          <p className="mt-2 text-xs text-gray-500">
            {permission === 'superadmin' && 'Accès complet au système'}
            {permission === 'admin' && 'Peut créer des équipes'}
            {permission === 'user' && 'Accès utilisateur standard'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'En cours...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}