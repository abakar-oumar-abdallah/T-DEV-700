"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/contexts/TeamContext'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import {
  getSuperadminStats,
  getAllUsers,
  searchUserByEmail,
  updateUserPermission,
  deleteUser,
  getAllTeams,
  deleteTeam
} from '@/superadmin/superadmin'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  permission: 'user' | 'admin' | 'superadmin'
  phone_number?: string
  created_at: string
  user_team?: Array<{
    id: number
    role: string
    team: {
      id: number
      name: string
    }
  }>
}

interface Team {
  id: number
  name: string
  description?: string
  lateness_limit: number
  timezone: string
  created_at: string
  memberCount: number
}

interface DashboardStats {
  totalUsers: number
  totalAdmins: number
  totalSuperadmins: number
  totalTeams: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function SuperadminPage() {
  const router = useRouter()
  const { user } = useTeam()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'teams'>('dashboard')
  
  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Users
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null)
  const [usersPage, setUsersPage] = useState(1)
  
  // Teams
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [teamsPagination, setTeamsPagination] = useState<Pagination | null>(null)
  const [teamsPage, setTeamsPage] = useState(1)
  
  // Modals
  const [showEditPermissionModal, setShowEditPermissionModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newPermission, setNewPermission] = useState<'user' | 'admin' | 'superadmin'>('user')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleteUserLoading, setDeleteUserLoading] = useState(false)
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null)
  
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [deleteTeamLoading, setDeleteTeamLoading] = useState(false)
  const [deleteTeamError, setDeleteTeamError] = useState<string | null>(null)
  
  const [error, setError] = useState<string | null>(null)

  // Vérification du rôle superadmin
  useEffect(() => {
    setMounted(true)
    
    // Vérifier si l'utilisateur est superadmin
    if (user && user.permission !== 'superadmin') {
      setError('Accès refusé : vous devez être superadmin')
      setTimeout(() => router.push('/dashboard'), 2000)
      return
    }
    
    if (user && user.permission === 'superadmin') {
      loadStats()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'teams') {
      loadTeams()
    }
  }, [activeTab, usersPage, teamsPage])

  const loadStats = async () => {
    setStatsLoading(true)
    setError(null)
    
    const result = await getSuperadminStats()
    
    if (result.success && result.data) {
      setStats(result.data)
    } else {
      setError(result.message || 'Erreur lors du chargement des statistiques')
      if (result.error?.includes('Forbidden') || result.error?.includes('Superadmin')) {
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }
    
    setStatsLoading(false)
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    setError(null)
    
    const result = await getAllUsers(usersPage, 20)
    
    if (result.success && result.data) {
      setUsers(result.data)
      if (result.pagination) {
        setUsersPagination(result.pagination)
      }
    } else {
      setError(result.message || 'Erreur lors du chargement des utilisateurs')
    }
    
    setUsersLoading(false)
  }

  const handleSearchUsers = async () => {
    if (!searchEmail.trim()) {
      setUsersPage(1)
      loadUsers()
      return
    }
    
    setUsersLoading(true)
    setError(null)
    
    const result = await searchUserByEmail(searchEmail)
    
    if (result.success && result.data) {
      setUsers(result.data)
      setUsersPagination(null) // Pas de pagination pour la recherche
    } else {
      setError(result.message || 'Erreur lors de la recherche')
    }
    
    setUsersLoading(false)
  }

  const loadTeams = async () => {
    setTeamsLoading(true)
    setError(null)
    
    const result = await getAllTeams(teamsPage, 20)
    
    if (result.success && result.data) {
      setTeams(result.data)
      if (result.pagination) {
        setTeamsPagination(result.pagination)
      }
    } else {
      setError(result.message || 'Erreur lors du chargement des équipes')
    }
    
    setTeamsLoading(false)
  }

  const openEditPermissionModal = (user: User) => {
    setEditingUser(user)
    setNewPermission(user.permission)
    setEditError(null)
    setEditSuccess(null)
    setShowEditPermissionModal(true)
  }

  const handleUpdatePermission = async () => {
    if (!editingUser) return
    
    setEditLoading(true)
    setEditError(null)
    setEditSuccess(null)
    
    const result = await updateUserPermission(editingUser.id, newPermission)
    
    if (result.success) {
      setEditSuccess(result.message || 'Permissions mises à jour avec succès')
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, permission: newPermission }
          : u
      ))
      
      setTimeout(() => {
        setShowEditPermissionModal(false)
        setEditingUser(null)
        loadStats()
      }, 1500)
    } else {
      setEditError(result.message || 'Erreur lors de la mise à jour')
    }
    
    setEditLoading(false)
  }

  const openDeleteUserModal = (user: User) => {
    setDeletingUser(user)
    setDeleteUserError(null)
    setShowDeleteUserModal(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    setDeleteUserLoading(true)
    setDeleteUserError(null)
    
    const result = await deleteUser(deletingUser.id)
    
    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
      setShowDeleteUserModal(false)
      setDeletingUser(null)
      loadStats()
    } else {
      setDeleteUserError(result.message || 'Erreur lors de la suppression')
    }
    
    setDeleteUserLoading(false)
  }

  const openDeleteTeamModal = (team: Team) => {
    setDeletingTeam(team)
    setDeleteTeamError(null)
    setShowDeleteTeamModal(true)
  }

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return
    
    setDeleteTeamLoading(true)
    setDeleteTeamError(null)
    
    const result = await deleteTeam(deletingTeam.id)
    
    if (result.success) {
      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id))
      setShowDeleteTeamModal(false)
      setDeletingTeam(null)
      loadStats()
    } else {
      setDeleteTeamError(result.message || 'Erreur lors de la suppression')
    }
    
    setDeleteTeamLoading(false)
  }

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'superadmin': return 'bg-red-500 text-white'
      case 'admin': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'superadmin': return 'Superadmin'
      case 'admin': return 'Admin'
      default: return 'Utilisateur'
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-10 min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
      {/* Header */}
      <div className={`bg-gradient-to-r from-red-600 to-red-500 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white shadow-2xl flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                Administration
              </h1>
              <p className="text-white/90 text-xs sm:text-sm lg:text-base">
                Gestion du système
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-all text-sm sm:text-base whitespace-nowrap"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <UsersIcon className="w-5 h-5 inline mr-2" />
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'teams'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BuildingOffice2Icon className="w-5 h-5 inline mr-2" />
            Équipes
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : stats ? (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Utilisateurs</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Admins</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAdmins}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Superadmins</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSuperadmins}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <BuildingOffice2Icon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Équipes</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTeams}</p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="Rechercher par email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearchUsers}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Rechercher
              </button>
              {searchEmail && (
                <button
                  onClick={() => {
                    setSearchEmail('')
                    loadUsers()
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Users List */}
          <div className="divide-y divide-gray-100">
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPermissionBadgeColor(user.permission)}`}>
                          {getPermissionLabel(user.permission)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                      {user.user_team && user.user_team.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.user_team.length} équipe{user.user_team.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditPermissionModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier les permissions"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteUserModal(user)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Users */}
          {!searchEmail && usersPagination && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {usersPagination.page} sur {usersPagination.totalPages} 
                <span className="ml-2 text-gray-500">
                  ({usersPagination.total} utilisateur{usersPagination.total > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                  disabled={!usersPagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setUsersPage(prev => prev + 1)}
                  disabled={!usersPagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="divide-y divide-gray-100">
            {teamsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">Aucune équipe trouvée</p>
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{team.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{team.description || 'Aucune description'}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>👥 {team.memberCount} membre{team.memberCount > 1 ? 's' : ''}</span>
                        <span>⏱️ Limite retard: {team.lateness_limit} min</span>
                        <span>🌍 {team.timezone}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openDeleteTeamModal(team)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer l'équipe"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Teams */}
          {teamsPagination && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {teamsPagination.page} sur {teamsPagination.totalPages}
                <span className="ml-2 text-gray-500">
                  ({teamsPagination.total} équipe{teamsPagination.total > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTeamsPage(prev => Math.max(1, prev - 1))}
                  disabled={!teamsPagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setTeamsPage(prev => prev + 1)}
                  disabled={!teamsPagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Edit Permission */}
      {showEditPermissionModal && editingUser && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowEditPermissionModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Modifier les permissions
                    </h3>
                    <button
                      onClick={() => setShowEditPermissionModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">{editError}</p>
                    </div>
                  )}
                  {editSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-800 text-sm">{editSuccess}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                      <strong>{editingUser.first_name} {editingUser.last_name}</strong>
                      <br />
                      <span className="text-sm text-gray-600">{editingUser.email}</span>
                    </p>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau de permission
                    </label>
                    <select
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={editLoading}
                    >
                      <option value="user">Utilisateur</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    
                    <p className="mt-2 text-xs text-gray-500">
                      {newPermission === 'superadmin' && '🔴 Accès complet au système'}
                      {newPermission === 'admin' && '🔵 Peut créer des équipes'}
                      {newPermission === 'user' && '⚪ Accès utilisateur standard'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEditPermissionModal(false)}
                      disabled={editLoading}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleUpdatePermission}
                      disabled={editLoading}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                      {editLoading ? 'En cours...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Delete User */}
      {showDeleteUserModal && deletingUser && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowDeleteUserModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                      <h3 className="text-xl font-bold text-white">
                        Supprimer l'utilisateur
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteUserModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {deleteUserError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">{deleteUserError}</p>
                    </div>
                  )}

                  <p className="text-gray-700 mb-4">
                    Êtes-vous sûr de vouloir supprimer l'utilisateur :
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="font-semibold text-gray-900">
                      {deletingUser.first_name} {deletingUser.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{deletingUser.email}</p>
                  </div>
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Cette action est irréversible et supprimera toutes les données associées.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowDeleteUserModal(false)}
                      disabled={deleteUserLoading}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={deleteUserLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                      {deleteUserLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Delete Team */}
      {showDeleteTeamModal && deletingTeam && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowDeleteTeamModal(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                      <h3 className="text-xl font-bold text-white">
                        Supprimer l'équipe
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowDeleteTeamModal(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {deleteTeamError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">{deleteTeamError}</p>
                    </div>
                  )}

                  <p className="text-gray-700 mb-4">
                    Êtes-vous sûr de vouloir supprimer l'équipe :
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="font-semibold text-gray-900">{deletingTeam.name}</p>
                    <p className="text-sm text-gray-600">
                      {deletingTeam.memberCount} membre{deletingTeam.memberCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Cette action est irréversible et supprimera toutes les associations utilisateurs.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowDeleteTeamModal(false)}
                      disabled={deleteTeamLoading}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteTeam}
                      disabled={deleteTeamLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                      {deleteTeamLoading ? 'Suppression...' : 'Supprimer'}
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
