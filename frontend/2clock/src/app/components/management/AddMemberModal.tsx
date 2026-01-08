import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createEmployeeInTeam } from '@/user/user';
import { ModifyUserTeamPlanning } from '@/planning/planning';

interface AddMemberModalProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMember: any) => void;
}

interface Schedule {
  day: string;
  time_in: string;
  time_out: string;
  enabled: boolean;
}

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche'
};

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
  const [schedules, setSchedules] = useState<Schedule[]>([
    { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
    { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
    { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
  ]);

  const handleScheduleChange = (index: number, field: 'time_in' | 'time_out' | 'enabled', value: string | boolean) => {
    const newSchedules = [...schedules];
    if (field === 'enabled') {
      newSchedules[index].enabled = value as boolean;
    } else {
      newSchedules[index][field] = value as string;
    }
    setSchedules(newSchedules);
  };

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

  const addExistingUserToTeam = async (emailToAdd?: string) => {
    // Validate custom planning if enabled
    if (hasCustomPlanning) {
      const enabledSchedules = schedules.filter(s => s.enabled);
      if (enabledSchedules.length === 0) {
        setError('Veuillez activer au moins un jour dans le planning personnalisé');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('session');
      if (!token) {
        setError('Session expirée');
        setLoading(false);
        return;
      }

      const emailToUse = emailToAdd || existingUserEmail || formData.email;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKENDURL}/userteams/email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: emailToUse,
            teamId: teamId,
            role: 'employee'
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        const translatedError = translateError(result.message || 'Erreur lors de l\'ajout de l\'utilisateur existant');
        setError(translatedError);
        
        // Don't show the prompt if user is already in the team
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

      // If custom planning is enabled, update the planning
      if (hasCustomPlanning && addedMember.id) {
        const enabledSchedules = schedules
          .filter(schedule => schedule.enabled)
          .map(schedule => ({
            day: schedule.day,
            time_in: schedule.time_in + ':00',
            time_out: schedule.time_out + ':00'
          }));

        console.log('Updating planning for existing user:', {
          userTeamId: addedMember.id,
          schedules: enabledSchedules
        });

        const planningResult = await ModifyUserTeamPlanning(addedMember.id, {
          schedules: enabledSchedules
        });

        if (!planningResult.success) {
          console.error('Planning update failed:', planningResult);
          setError('Utilisateur ajouté mais erreur lors de la configuration du planning personnalisé');
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

    // If existing user mode, call addExistingUserToTeam directly
    if (isExistingUser) {
      await addExistingUserToTeam();
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Validate custom planning if enabled
    if (hasCustomPlanning) {
      const enabledSchedules = schedules.filter(s => s.enabled);
      if (enabledSchedules.length === 0) {
        setError('Veuillez activer au moins un jour dans le planning personnalisé');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create employee
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

      if (!result.success) {
        // Check if error is about existing email
        const errorMessage = result.message?.toLowerCase() || '';
        const errorString = result.error?.toLowerCase() || '';
        
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
      console.log('Employee created:', newMember);

      // Step 2: If custom planning is enabled, update the planning
      if (hasCustomPlanning && newMember.id) {
        const enabledSchedules = schedules
          .filter(schedule => schedule.enabled)
          .map(schedule => ({
            day: schedule.day,
            time_in: schedule.time_in + ':00',
            time_out: schedule.time_out + ':00'
          }));

        console.log('Updating planning for new user:', {
          userTeamId: newMember.id,
          schedules: enabledSchedules
        });

        const planningResult = await ModifyUserTeamPlanning(newMember.id, {
          schedules: enabledSchedules
        });

        if (!planningResult.success) {
          console.error('Planning update failed:', planningResult);
          setError('Employé créé mais erreur lors de la configuration du planning personnalisé');
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
      
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        password: '',
        confirmPassword: ''
      });
      setHasCustomPlanning(false);
      setSchedules([
        { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
        { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
        { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
        { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
        { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
        { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
        { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
      ]);

      setTimeout(() => {
        onSuccess(newMember);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'ajout de l\'employé');
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
    setSchedules([
      { day: 'monday', time_in: '09:00', time_out: '17:00', enabled: true },
      { day: 'tuesday', time_in: '09:00', time_out: '17:00', enabled: true },
      { day: 'wednesday', time_in: '09:00', time_out: '17:00', enabled: true },
      { day: 'thursday', time_in: '09:00', time_out: '17:00', enabled: true },
      { day: 'friday', time_in: '09:00', time_out: '17:00', enabled: true },
      { day: 'saturday', time_in: '09:00', time_out: '17:00', enabled: false },
      { day: 'sunday', time_in: '09:00', time_out: '17:00', enabled: false }
    ]);
    onClose();
  };

  const handleCancelExistingUser = () => {
    setShowExistingUserPrompt(false);
    setExistingUserEmail('');
    setError(null);
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
          <h2 className="text-2xl font-bold text-gray-900">Ajouter un employé</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

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
                  // Reset form data when toggling
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
                      onClick={() => addExistingUserToTeam(existingUserEmail)}
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
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Configurez un planning spécifique pour cet employé. Sinon, le planning par défaut de l&apos;équipe sera utilisé.
                </p>

                <div className="space-y-3">
                  {schedules.map((schedule, index) => (
                    <div key={schedule.day} className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                          disabled={loading}
                        />
                        <span className="font-medium text-gray-700">{dayLabels[schedule.day]}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Début</label>
                        <input
                          type="time"
                          value={schedule.time_in}
                          onChange={(e) => handleScheduleChange(index, 'time_in', e.target.value)}
                          disabled={!schedule.enabled || loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fin</label>
                        <input
                          type="time"
                          value={schedule.time_out}
                          onChange={(e) => handleScheduleChange(index, 'time_out', e.target.value)}
                          disabled={!schedule.enabled || loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-xs">
                    Astuce : Décochez les jours de repos
                  </p>
                </div>
              </div>
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
      </div>
    </div>
  );
}