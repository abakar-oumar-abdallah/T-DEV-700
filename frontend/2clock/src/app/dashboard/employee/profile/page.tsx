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
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'

export default function ProfilePage() {
  const { user } = useTeam()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phonenumber: ''
  })

  useEffect(() => {
    setMounted(true)
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phonenumber: user.phonenumber || ''
      })
    }
  }, [user])

  const getInitials = () => {
    if (!user) return '?'
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || ''
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || '?'
  }

  const handleSave = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL
      const response = await fetch(`${backendUrl}/user/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditing(false)
        // Optionally refresh user data from context
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phonenumber: user.phonenumber || ''
      })
    }
  }

  return (
    <main className="p-6 sm:p-10 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary)]/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Header Card */}
      <div className={`bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with initials */}
          <div className={`relative transition-all duration-500 ${
            mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
          }`} style={{ transitionDelay: '100ms' }}>
            <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-5xl font-bold bg-gradient-to-br from-[var(--color-primary)] to-purple-600 bg-clip-text text-transparent relative z-10">
                {getInitials()}
              </span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* User info */}
          <div className={`flex-1 text-center sm:text-left transition-all duration-500 ${
            mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <h1 className="text-4xl font-bold text-white mb-2">
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-white/90 text-lg mb-3">{user?.email}</p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                <ShieldCheckIcon className="w-4 h-4" />
                Employé
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                Actif
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-all duration-300 group ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <PencilSquareIcon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '400ms' }}>
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              Informations personnelles
            </h2>
          </div>
          
          <div className="p-6 space-y-5">
            {/* First Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600"></div>
                Prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none"
                />
              ) : (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200 font-medium text-gray-900 group-hover:border-[var(--color-primary)] transition-colors duration-300">
                  {user?.first_name}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-purple-600"></div>
                Nom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none"
                />
              ) : (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200 font-medium text-gray-900 group-hover:border-[var(--color-primary)] transition-colors duration-300">
                  {user?.last_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '500ms' }}>
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                <EnvelopeIcon className="w-5 h-5 text-white" />
              </div>
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
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none"
                />
              ) : (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200 font-medium text-gray-900 group-hover:border-green-500 transition-colors duration-300">
                  {user?.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-[var(--color-primary)]" />
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phonenumber}
                  onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 outline-none"
                  placeholder="Aucun numéro fourni"
                />
              ) : (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg border border-gray-200 font-medium text-gray-900 group-hover:border-green-500 transition-colors duration-300">
                  {user?.phonenumber || 'Aucun numéro fourni'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className={`mt-6 flex gap-4 justify-end transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '600ms' }}>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group"
          >
            <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] hover:shadow-xl text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group hover:scale-105"
          >
            <CheckIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            Enregistrer
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">0</span>
          </div>
          <p className="text-gray-600 font-medium">Jours travaillés</p>
        </div>

        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">100%</span>
          </div>
          <p className="text-gray-600 font-medium">Présence</p>
        </div>

        <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '900ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">A+</span>
          </div>
          <p className="text-gray-600 font-medium">Performance</p>
        </div>
      </div>
    </main>
  )
}