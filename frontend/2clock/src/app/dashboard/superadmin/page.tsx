"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTeam } from '@/contexts/TeamContext'
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  PlusIcon
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
import SuperAdminStatCard from '@/app/components/superadmin/SuperAdminStatCard'
import UsersList from '@/app/components/superadmin/UsersList'
import TeamsList from '@/app/components/superadmin/TeamsList'
import EditPermissionModal from '@/app/components/superadmin/EditPermissionModal'
import DeleteUserModal from '@/app/components/superadmin/DeleteUserModal'
import DeleteTeamModal from '@/app/components/team/DeleteTeamModal'
import CreateUserModal from '@/app/components/superadmin/CreateUserModal'

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
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  
  const [error, setError] = useState<string | null>(null)

  // Vérification du rôle superadmin
  useEffect(() => {
    setMounted(true)
    
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

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      loadUsers()
      return
    }

    setUsersLoading(true)
    setError(null)

    const result = await searchUserByEmail(searchEmail)

    if (result.success && result.data) {
      setUsers([result.data])
      setUsersPagination(null)
    } else {
      setError(result.message || 'Utilisateur non trouvé')
      setUsers([])
    }

    setUsersLoading(false)
  }

  const handleCreateUserSuccess = (newUser: any) => {
    setUsers(prev => [newUser, ...prev])
    loadStats()
    setShowCreateUserModal(false)
  }

  const handleUpdatePermission = async (userId: number, permission: 'user' | 'admin' | 'superadmin') => {
    const result = await updateUserPermission(userId, permission)
    
    if (result.success) {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, permission } : u
      ))
      loadStats()
    } else {
      throw new Error(result.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    const result = await deleteUser(userId)
    
    if (result.success) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      loadStats()
    } else {
      throw new Error(result.message || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteTeamSuccess = () => {
    if (deletingTeam) {
      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id))
      loadStats()
    }
    setDeletingTeam(null)
  }

  // Convertir Team en format attendu par DeleteTeamModal
  const convertTeamForModal = (team: Team | null) => {
    if (!team) return null
    
    return {
      id: team.id.toString(),
      role: 'owner', // Superadmin a tous les droits
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        lateness_limit: team.lateness_limit,
        timezone: team.timezone
      }
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
              <SuperAdminStatCard
                icon={<UsersIcon className="w-6 h-6" />}
                label="Total Utilisateurs"
                value={stats.totalUsers}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <SuperAdminStatCard
                icon={<ShieldCheckIcon className="w-6 h-6" />}
                label="Admins"
                value={stats.totalAdmins}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <SuperAdminStatCard
                icon={<ShieldCheckIcon className="w-6 h-6" />}
                label="Superadmins"
                value={stats.totalSuperadmins}
                bgColor="bg-red-100"
                iconColor="text-red-600"
              />
              <SuperAdminStatCard
                icon={<BuildingOffice2Icon className="w-6 h-6" />}
                label="Total Équipes"
                value={stats.totalTeams}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
            </>
          ) : null}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Search Bar and Create Button */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                    placeholder="Rechercher par email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearchUser}
                  className="px-6 py-2.5 bg-[var(--color-secondary)] text-white rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  Rechercher
                </button>
                {searchEmail && (
                  <button
                    onClick={() => {
                      setSearchEmail('')
                      loadUsers()
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <PlusIcon className="w-5 h-5" />
                Créer un utilisateur
              </button>
            </div>
          </div>

          <UsersList
            users={users}
            loading={usersLoading}
            pagination={searchEmail ? null : usersPagination}
            onEditPermission={setEditingUser}
            onDeleteUser={setDeletingUser}
            onPageChange={setUsersPage}
          />
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <TeamsList
            teams={teams}
            loading={teamsLoading}
            pagination={teamsPagination}
            onDeleteTeam={setDeletingTeam}
            onPageChange={setTeamsPage}
          />
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onSuccess={handleCreateUserSuccess}
      />

      <EditPermissionModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdatePermission}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onDelete={handleDeleteUser}
      />

      <DeleteTeamModal
        team={convertTeamForModal(deletingTeam)}
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onSuccess={handleDeleteTeamSuccess}
      />
    </main>
  )
}