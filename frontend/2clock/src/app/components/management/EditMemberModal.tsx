import React, { useState, useEffect } from 'react';
import { updateUser } from '@/user/user';
import { updateUserTeamRole } from '@/team/management';
import { useTeam } from '@/contexts/TeamContext';
import PlanningForm from '../PlanningForm';
import Modal from '../Modal';

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
  const { currentTeam, user } = useTeam();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  // Determine if current user can change roles
  const isSuperadmin = user?.permission === 'superadmin';
  const isOwner = currentTeam?.role === 'owner' || isSuperadmin;
  const canChangeRole = isOwner;

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        email: member.user.email,
        first_name: member.user.first_name,
        last_name: member.user.last_name,
        phone_number: member.user.phonenumber || '',
        password: '',
        confirmPassword: '',
        role: member.role
      });
      setError(null);
      setSuccess(null);
    }
  }, [member, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    // Validate passwords if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user information has changed
      const userInfoChanged = 
        formData.email !== member.user.email ||
        formData.first_name !== member.user.first_name ||
        formData.last_name !== member.user.last_name ||
        formData.phone_number !== (member.user.phonenumber || '') ||
        formData.password !== '';

      // Check if role has changed
      const roleChanged = formData.role !== member.role && canChangeRole;

      // If only role changed, update only userTeam
      if (roleChanged && !userInfoChanged) {
        const roleUpdateResult = await updateUserTeamRole(member.user.id, teamId, formData.role);
        
        if (!roleUpdateResult.success) {
          setError(roleUpdateResult.message || 'Erreur lors du changement de rôle');
          setLoading(false);
          return;
        }

        // Build updated member object with new role
        const updatedMember = {
          ...member,
          role: formData.role
        };
        
        setSuccess('Rôle modifié avec succès');
        
        setTimeout(() => {
          onSuccess(updatedMember);
          onClose();
        }, 1500);
        
        return;
      }

      // If user information changed, update user first WITH teamId
      if (userInfoChanged) {
        const updateData: any = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number
        };

        // Only add password if it was filled in
        if (formData.password) {
          updateData.password = formData.password;
        }

        // Pass teamId as third parameter for permission check
        const userUpdateResult = await updateUser(member.user.id, updateData, teamId);

        if (!userUpdateResult.success) {
          setError(userUpdateResult.message || 'Erreur lors de la modification des informations');
          setLoading(false);
          return;
        }
      }

      // Update role if it has changed and user has permission
      if (roleChanged) {
        const roleUpdateResult = await updateUserTeamRole(member.user.id, teamId, formData.role);
        
        if (!roleUpdateResult.success) {
          setError(userInfoChanged 
            ? 'Informations mises à jour mais erreur lors du changement de rôle'
            : 'Erreur lors du changement de rôle');
          setLoading(false);
          return;
        }
      }

      // Build updated member object
      const updatedMember = {
        ...member,
        role: formData.role,
        user: {
          ...member.user,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phonenumber: formData.phone_number
        }
      };
      
      setSuccess('Employé modifié avec succès');
      
      setTimeout(() => {
        onSuccess(updatedMember);
        onClose();
      }, 1500);
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
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      role: '',
    });
    onClose();
  };

  if (!isOpen || !member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier un employé"
      mode="update"
      maxWidth="md"
    >
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+33 6 12 34 56 78"
              disabled={loading}
            />
          </div>

          {/* Role Section - Only visible to owners and superadmins */}
          {canChangeRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                {isSuperadmin && <option value="owner">Propriétaire</option>}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperadmin 
                  ? "En tant que superadmin, vous avez tous les droits"
                  : "En tant que propriétaire, vous pouvez promouvoir des employés en managers"}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Modifier le mot de passe</h4>
            <p className="text-xs text-gray-500 mb-3">Laissez vide pour ne pas changer le mot de passe</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
              </div>
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
            teamId={parseInt(teamId)}
            currentPlanningId={member.planning_id}
            context="member"
            title={`Planning de ${member.user.first_name} ${member.user.last_name}`}
            onSuccess={() => {}}
          />
        </div>
      </div>
    </Modal>
  );
}