"use client"

import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ChevronLeftIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { createEmployeeInTeam, updateUser, removeUserFromTeam } from '@/user/user'

interface TeamMember {
  role: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    phonenumber?: string
  }
}

export default function ManagerTeamPage() {
  const { currentTeam, user } = useTeam()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  // États pour le modal d'ajout d'employé
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  })

  // États pour le modal de modification
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    email: '',
    first_name: '',
    last_name: ''
  })

  // États pour le modal de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)


  useEffect(() => {
    setMounted(true)
  }, [])

  // Vérifier si l'utilisateur est manager
  const isManager = currentTeam?.role === 'manager'

  useEffect(() => {
    if (currentTeam && !isManager) {
      router.push('/dashboard/employee')
    }
  }, [currentTeam, isManager, router])

  // Charger les membres de l'équipe
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentTeam?.team.id) return

      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('session')
        if (!token) {
          setError('Session expirée')
          router.push('/login')
          return
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKENDURL}/teams/${currentTeam.team.id}/users`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expirée')
            router.push('/login')
            return
          }
          throw new Error('Erreur lors du chargement des membres')
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          setTeamMembers(result.data)
        } else {
          setError(result.message || 'Erreur lors du chargement')
        }
      } catch (err) {
        console.error('Erreur:', err)
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    if (currentTeam && isManager) {
      fetchTeamMembers()
    }
  }, [currentTeam, isManager, router])

  // Fonction pour ajouter un employé
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setAddError('Les mots de passe ne correspondent pas')
      return
    }

    if (!currentTeam?.team.id) {
      setAddError('Erreur: équipe non sélectionnée')
      return
    }

    setAddLoading(true)
    setAddError(null)
    setAddSuccess(null)

    try {
      const result = await createEmployeeInTeam(
        {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number || '',
          password: formData.password
        },
        String(currentTeam.team.id)
      )

      if (result.success && result.data) {
        setTeamMembers(prev => [...prev, result.data!])
        setAddSuccess(result.message)
        
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          password: '',
          confirmPassword: ''
        })

        setTimeout(() => {
          setShowAddModal(false)
          setAddSuccess(null)
        }, 1500)
      } else {
        setAddError(result.message || 'Erreur lors de l\'ajout de l\'employé')
        if (result.error?.includes('Session')) {
          setTimeout(() => router.push('/login'), 1500)
        }
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setAddError('Erreur lors de l\'ajout de l\'employé')
    } finally {
      setAddLoading(false)
    }
  }

  // Ouvrir modal de modification
  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setEditFormData({
      email: member.user.email,
      first_name: member.user.first_name,
      last_name: member.user.last_name
    })
    setEditError(null)
    setEditSuccess(null)
    setShowEditModal(true)
  }

  // Modifier un employé
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember) return

    setEditLoading(true)
    setEditError(null)
    setEditSuccess(null)

    try {
      const result = await updateUser(editingMember.user.id, {
        email: editFormData.email,
        first_name: editFormData.first_name,
        last_name: editFormData.last_name
      })

      if (result.success) {
        setTeamMembers(prev => prev.map(m => 
          m.user.id === editingMember.user.id
            ? {
                ...m,
                user: {
                  ...m.user,
                  email: editFormData.email,
                  first_name: editFormData.first_name,
                  last_name: editFormData.last_name
                }
              }
            : m
        ))
        setEditSuccess(result.message || 'Employé modifié avec succès')
        
        setTimeout(() => {
          setShowEditModal(false)
          setEditSuccess(null)
          setEditingMember(null)
        }, 1500)
      } else {
        setEditError(result.message || 'Erreur lors de la modification')
        if (result.error?.includes('Session')) {
          setTimeout(() => router.push('/login'), 1500)
        }
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setEditError('Erreur lors de la modification de l\'employé')
    } finally {
      setEditLoading(false)
    }
  }

  // Ouvrir modal de suppression
  const openDeleteModal = (member: TeamMember) => {
    setDeletingMember(member)
    setDeleteError(null)
    setShowDeleteModal(true)
  }

  // Supprimer un employé
  const handleDeleteEmployee = async () => {
    if (!deletingMember || !currentTeam?.team.id) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const result = await removeUserFromTeam(
        deletingMember.user.id,
        String(currentTeam.team.id)
      )

      if (result.success) {
        setTeamMembers(prev => prev.filter(m => m.user.id !== deletingMember.user.id))
        setShowDeleteModal(false)
        setDeletingMember(null)
      } else {
        setDeleteError(result.message || 'Erreur lors de la suppression')
        if (result.error?.includes('Session')) {
          setTimeout(() => router.push('/login'), 1500)
        }
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setDeleteError('Erreur lors de la suppression de l\'employé')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || '?'
  }

  const getRoleColor = (role: string) => {
    return role === 'manager' 
      ? 'bg-blue-500 text-white' 
      : 'bg-green-500 text-white'
  }

  const getRoleLabel = (role: string) => {
    return role === 'manager' ? 'Manager' : 'Employé'
  }

  if (!currentTeam || !isManager) {
    return null
  }
const filteredMembers = teamMembers.filter(member => {
  const fullName = `${member.user.first_name} ${member.user.last_name}`.toLowerCase()
  const email = member.user.email.toLowerCase()
  const value = search.toLowerCase()

  return (
    fullName.includes(value) ||
    email.includes(value)
  )
})

  return (
    <main className="p-6 sm:p-10 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary)]/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <div className={`bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] rounded-2xl shadow-xl p-6 sm:p-8 mb-8 relative overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={() => router.push('/teams')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors duration-200"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Retour aux équipes</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/employee')}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-all duration-200"
          >
            <span className="font-medium">Tableau de bord</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center flex-shrink-0">
            <BuildingOffice2Icon className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-primary)]" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {currentTeam.team.name}
            </h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-3">
              {currentTeam.team.description || 'Gestion de l\'équipe'}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium">
                <UserGroupIcon className="w-4 h-4 inline mr-2" />
                {teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}
              </span>
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium">
                Limite: {currentTeam.team.lateness_limit} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-6 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        
        <>
        {/* Search */}
          <div className="mb-4 bg-white rounded-xl shadow border border-gray-100 px-6 py-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre..."
              className="
                w-full
                rounded-xl
                border border-gray-300
                px-4 py-2.5
                text-sm sm:text-base
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--color-primary)]
                focus:border-transparent
                transition-all
              "
            />
          </div>

          {/* Team Members List */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            {/* List Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Membres de l'équipe ({teamMembers.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] hover:from-[#ff6b4a] hover:to-[var(--color-primary)] text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Ajouter un employé</span>
              </button>
            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-100">
            {filteredMembers.map((member, index) => (
                <div
                  key={member.user.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-all duration-300 ${
                    mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${300 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-purple-500/20 flex items-center justify-center shadow-md ring-2 ring-white">
                        <span className="text-lg sm:text-xl font-bold bg-gradient-to-br from-[var(--color-primary)] to-purple-600 bg-clip-text text-transparent">
                          {getInitials(member.user.first_name, member.user.last_name)}
                        </span>
                      </div>
                      {member.user.id === user?.id && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white">
                          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {member.user.first_name} {member.user.last_name}
                        </h3>
                        {member.user.id === user?.id && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Vous
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <EnvelopeIcon className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                        
                        {member.user.phonenumber && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                            <span>{member.user.phonenumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(member.role)} shadow-sm`}>
                        {getRoleLabel(member.role)}
                      </span>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(member)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {teamMembers.length === 0 && !loading && (
            <div className={`bg-white rounded-2xl shadow-lg p-12 text-center transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre</h3>
              <p className="text-gray-500 mb-4">Cette équipe n&apos;a pas encore de membres.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Ajouter le premier employé
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal d'ajout d'employé */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Ajouter un employé</h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                  {addError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{addError}</p>
                    </div>
                  )}
                  {addSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm">{addSuccess}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="employe@example.com"
                      disabled={addLoading}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        placeholder="Jean"
                        disabled={addLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        placeholder="Dupont"
                        disabled={addLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="+33 6 12 34 56 78"
                      disabled={addLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="••••••••"
                      minLength={6}
                      disabled={addLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      placeholder="••••••••"
                      minLength={6}
                      disabled={addLoading}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      disabled={addLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
                    >
                      {addLoading ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de modification */}
      {showEditModal && editingMember && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Modifier l'utilisateur</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEditEmployee} className="p-6 space-y-4">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{editError}</p>
                    </div>
                  )}
                  {editSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 text-sm">{editSuccess}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="employe@example.com"
                      disabled={editLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.first_name}
                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Jean"
                        disabled={editLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.last_name}
                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dupont"
                        disabled={editLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      disabled={editLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
                    >
                      {editLoading ? 'Modification...' : 'Modifier'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && deletingMember && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Supprimer l'employé</h2>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                      <XMarkIcon className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">{deleteError}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <TrashIcon className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  <p className="text-center text-gray-700 mb-2">
                    Êtes-vous sûr de vouloir retirer cet employé de l'équipe ?
                  </p>
                  <p className="text-center text-sm text-gray-500 mb-6">
                    <strong>{deletingMember.user.first_name} {deletingMember.user.last_name}</strong>
                    <br />
                    ({deletingMember.user.email})
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleteLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteEmployee}
                      disabled={deleteLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium"
                    >
                      {deleteLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}