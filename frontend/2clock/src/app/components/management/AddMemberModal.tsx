import React, { useState, useRef } from 'react';
import { createEmployeeInTeam } from '@/user/user';
import { addExistingUserToTeam } from '@/team/management';
import { ModifyUserTeamPlanning } from '@/planning/planning';
import Modal from '../Modal';
import PlanningForm from '../PlanningForm';

interface AddMemberModalProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMember: any) => void;
}

export default function AddMemberModal({ teamId, isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showExistingUserPrompt, setShowExistingUserPrompt] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });

  // Planning states
  const [hasCustomPlanning, setHasCustomPlanning] = useState(false);
  const planningFormRef = useRef<{ getSchedulesData: () => any }>(null);

  const translateError = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('already associated') || 
        lowerMessage.includes('already exists') || 
        lowerMessage.includes('déjà associé')) {
      return 'Cet utilisateur fait déjà partie de cette équipe';
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('introuvable')) {
      return 'Utilisateur non trouvé avec cet email';
    }
    
    if (lowerMessage.includes('phone number must be') && lowerMessage.includes('characters long')) {
      const match = message.match(/(\d+)\s+characters/i);
      const length = match ? match[1] : '10';
      return `Le numéro de téléphone doit contenir ${length} caractères`;
    }
    
    return message;
  };

  const handleAddExistingUser = async (emailToAdd?: string, planningSchedules?: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const emailToUse = emailToAdd || existingUserEmail || formData.email;

      const result = await addExistingUserToTeam({
        email: emailToUse,
        teamId: teamId,
        role: 'employee'
      });

      if (!result.success) {
        const translatedError = translateError(result.message || 'Erreur lors de l\'ajout de l\'utilisateur existant');
        setError(translatedError);
        
        const lowerMessage = (result.message || '').toLowerCase();
        if (lowerMessage.includes('already associated') || 
            lowerMessage.includes('already exists') || 
            lowerMessage.includes('déjà associé')) {
          setShowExistingUserPrompt(false);
        }
        
        setLoading(false);
        return;
      }

      const addedMember = result.data;
      console.log('Added member response:', addedMember);

      // If custom planning is enabled and we have schedules, apply them
      if (hasCustomPlanning && planningSchedules && addedMember) {
        const userTeamId = addedMember.id;
        
        if (!userTeamId) {
          console.error('No userTeam ID found in response:', addedMember);
          setError('Utilisateur ajouté mais impossible de configurer le planning (ID manquant)');
          setLoading(false);
          setTimeout(() => {
            onSuccess(addedMember);
            handleClose();
          }, 2000);
          return;
        }

        console.log('Updating planning for userTeam ID:', userTeamId, 'with schedules:', planningSchedules);
        
        const planningResult = await ModifyUserTeamPlanning(userTeamId, {
          schedules: planningSchedules
        });

        console.log('Planning result:', planningResult);

        if (!planningResult.success) {
          console.error('Planning update failed:', planningResult);
          setError('Utilisateur ajouté mais erreur lors de la configuration du planning personnalisé: ' + (planningResult.message || planningResult.error));
          setLoading(false);
          setTimeout(() => {
            onSuccess(addedMember);
            handleClose();
          }, 2000);
          return;
        }
        console.log('Planning updated successfully:', planningResult);
      }

      setSuccess(hasCustomPlanning 
        ? 'Utilisateur ajouté avec planning personnalisé !' 
        : 'Utilisateur ajouté à l\'équipe avec succès'
      );

      setTimeout(() => {
        onSuccess(addedMember);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic form data first
    if (!isExistingUser && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Get planning data if custom planning is enabled
    let planningSchedules = null;
    if (hasCustomPlanning) {
      if (!planningFormRef.current) {
        setError('Erreur: Référence au formulaire de planning manquante');
        return;
      }

      const schedulesData = planningFormRef.current.getSchedulesData();
      console.log('Schedules data from PlanningForm:', schedulesData);
      
      if (!schedulesData || schedulesData.length === 0) {
        setError('Veuillez activer au moins un jour dans le planning personnalisé');
        return;
      }
      planningSchedules = schedulesData;
    }

    // If existing user mode, call handleAddExistingUser directly
    if (isExistingUser) {
      await handleAddExistingUser(undefined, planningSchedules);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create employee
      console.log('Creating employee with data:', {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        teamId
      });

      const result = await createEmployeeInTeam(
        {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number || '',
          password: formData.password
        },
        teamId
      );

      console.log('Employee creation result:', result);

      if (!result.success) {
        const errorMessage = result.message?.toLowerCase() || '';
        
        if (errorMessage.includes('email') && (errorMessage.includes('existe') || errorMessage.includes('exist') || errorMessage.includes('utilisé') || errorMessage.includes('already exists'))) {
          setExistingUserEmail(formData.email);
          setShowExistingUserPrompt(true);
          setError(`L'email ${formData.email} est déjà utilisé. Voulez-vous ajouter cet utilisateur existant à l'équipe ?`);
          setLoading(false);
          return;
        }
        
        setError(translateError(result.message || 'Erreur lors de l\'ajout de l\'employé'));
        setLoading(false);
        return;
      }

      if (!result.data) {
        setError('Erreur: Aucune donnée retournée');
        setLoading(false);
        return;
      }

      const newMember = result.data;
      console.log('Employee created, newMember data:', newMember);

      // If custom planning is enabled and we have schedules, apply them
      if (hasCustomPlanning && planningSchedules && newMember) {
        const userTeamId = newMember.id;
        
        if (!userTeamId) {
          console.error('No userTeam ID found in response:', newMember);
          setError('Employé créé mais impossible de configurer le planning (ID manquant)');
          setLoading(false);
          setTimeout(() => {
            onSuccess(newMember);
            handleClose();
          }, 2000);
          return;
        }

        console.log('Updating planning for userTeam ID:', userTeamId, 'with schedules:', planningSchedules);
        
        const planningResult = await ModifyUserTeamPlanning(userTeamId, {
          schedules: planningSchedules
        });

        console.log('Planning result:', planningResult);

        if (!planningResult.success) {
          console.error('Planning update failed:', planningResult);
          setError('Employé créé mais erreur lors de la configuration du planning personnalisé: ' + (planningResult.message || planningResult.error));
          setLoading(false);
          setTimeout(() => {
            onSuccess(newMember);
            handleClose();
          }, 2000);
          return;
        }
        console.log('Planning updated successfully:', planningResult);
      }

      setSuccess(hasCustomPlanning 
        ? 'Employé créé avec planning personnalisé !' 
        : result.message || 'Employé ajouté avec succès'
      );
      
      setTimeout(() => {
        onSuccess(newMember);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout de l\'employé: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setShowExistingUserPrompt(false);
    setExistingUserEmail('');
    setIsExistingUser(false);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      password: '',
      confirmPassword: ''
    });
    setHasCustomPlanning(false);
    onClose();
  };

  const handleCancelExistingUser = () => {
    setShowExistingUserPrompt(false);
    setExistingUserEmail('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ajouter un employé"
      mode="creation"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Existing User Checkbox */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="existing_user"
              checked={isExistingUser}
              onChange={(e) => {
                setIsExistingUser(e.target.checked);
                setError(null);
                setShowExistingUserPrompt(false);
                if (e.target.checked) {
                  setFormData({
                    email: formData.email,
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    password: '',
                    confirmPassword: ''
                  });
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="existing_user" className="text-sm font-medium text-blue-900 cursor-pointer">
              Utilisateur existant
            </label>
          </div>
          {isExistingUser && (
            <p className="text-xs text-blue-700 mt-2">
              Ajoutez un utilisateur déjà enregistré dans le système à cette équipe
            </p>
          )}
        </div>

        {/* User Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isExistingUser ? 'Email de l\'utilisateur' : 'Informations personnelles'}
          </h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
              {showExistingUserPrompt && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const schedulesData = hasCustomPlanning && planningFormRef.current 
                        ? planningFormRef.current.getSchedulesData() 
                        : null;
                      handleAddExistingUser(existingUserEmail, schedulesData);
                    }}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Oui, ajouter cet utilisateur
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelExistingUser}
                    disabled={loading}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                  >
                    Non, annuler
                  </button>
                </div>
              )}
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

          {!isExistingUser && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
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
                    maxLength={50}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </>
          )}
        </div>

        {/* Custom Planning Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="custom_planning"
              checked={hasCustomPlanning}
              onChange={(e) => setHasCustomPlanning(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="custom_planning" className="text-sm font-medium text-gray-900 cursor-pointer">
              Planning personnalisé
            </label>
          </div>

          {hasCustomPlanning && (
            <PlanningForm
              ref={planningFormRef}
              context="standalone"
              title="Planning personnalisé de l'employé"
              standalone={true}
            />
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
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
          >
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}