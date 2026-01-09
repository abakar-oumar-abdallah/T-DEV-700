"use client"
import React, { useState, useEffect } from 'react'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'
import { updateUser } from '@/user/user'
import Image from "next/image"

export default function ProfilePage() {
  const { user, refreshUser, setUser, currentTeam } = useTeam()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  })

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    setMounted(true)
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      })
    }
  }, [user])

  const getInitials = () => {
    if (!user) return '?'
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || ''
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || '?'
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateUser(user.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number
      })

      if (result.success) {
        setSuccess('Profil mis à jour avec succès')
        setIsEditing(false)
        
        if (setUser) {
          setUser({
            ...user,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone_number: formData.phone_number
          })
        }
        
        if (refreshUser) {
          await refreshUser()
        }
        
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } else {
        setError(result.message || 'Erreur lors de la mise à jour du profil')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const result = await updateUser(user.id, {
        password: passwordData.password
      })

      if (result.success) {
        setPasswordSuccess('Mot de passe modifié avec succès')
        setPasswordData({ password: '', confirmPassword: '' })
        setIsChangingPassword(false)
        
        setTimeout(() => {
          setPasswordSuccess(null)
        }, 3000)
      } else {
        setPasswordError(result.message || 'Erreur lors de la modification du mot de passe')
      }
    } catch (err: any) {
      console.error('Error updating password:', err)
      setPasswordError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccess(null)
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || ''
      })
    }
  }

  const handleCancelPassword = () => {
    setIsChangingPassword(false)
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordData({ password: '', confirmPassword: '' })
  }

  // Determine if user is active based on team selection
  const isActive = !!currentTeam

  return (
    <main className="p-6 sm:p-10 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary)]/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Header Card */}
      <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-transparent opacity-80 blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className={`relative transition-all duration-500 ${
            mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="relative group">
              <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image 
                  src={`https://api.dicebear.com/5.x/initials/svg?seed=${getInitials()}`} 
                  alt='Profile' 
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-12 h-12 ${isActive ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-4 border-white shadow-lg flex items-center justify-center`}>
              <div className={`w-3 h-3 bg-white rounded-full ${isActive ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>

          {/* User info */}
          <div className={`flex-1 text-center sm:text-left transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
              {formData.first_name} {formData.last_name}
            </h1>
            <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2 mb-3">
              <EnvelopeIcon className="w-4 h-4" />
              {formData.email}
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {user?.permission && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <ShieldCheckIcon className="w-4 h-4" />
                  {user.permission}
                </span>
              )}
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <CalendarIcon className="w-4 h-4" />
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-6 py-3 bg-[var(--color-secondary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2 ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <PencilSquareIcon className="w-5 h-5" />
              Modifier le profil
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 transition-all duration-300">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 transition-all duration-300">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            <div className="px-6 py-4 bg-[var(--color-primary)] border-b border-gray-100">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <UserIcon className="w-6 h-6" />
                Informations personnelles
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              {/* First Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing || loading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-75 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Last Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing || loading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-75 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="px-6 py-4 bg-[var(--color-primary-hover)] border-b border-gray-100">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <EnvelopeIcon className="w-6 h-6" />
                Coordonnées
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <EnvelopeIcon className="w-4 h-4 text-[var(--color-primary)]" />
                  Adresse email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing || loading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-75 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-[var(--color-primary)]" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!isEditing || loading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-75 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons for Profile */}
        {isEditing && (
          <div className={`mt-6 flex gap-4 justify-end transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Password Change Section */}
      <div className={`mt-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} style={{ transitionDelay: '700ms' }}>
        <div className="px-6 py-4 bg-[var(--color-secondary)] border-b border-gray-100">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <LockClosedIcon className="w-6 h-6" />
            Sécurité
          </h2>
        </div>

        <div className="p-6">
          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">{passwordSuccess}</p>
            </div>
          )}

          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-6 py-3 bg-[var(--color-secondary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2"
            >
              <LockClosedIcon className="w-5 h-5" />
              Modifier le mot de passe
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  disabled={passwordLoading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-50"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={passwordLoading}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none disabled:opacity-50"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  disabled={passwordLoading}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Modification...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Modifier
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}