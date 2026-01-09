"use client"

import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import Image from "next/image";
import { 
  UserGroupIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ChevronLeftIcon,
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import AddMemberModal from '@/app/components/management/AddMemberModal'
import EditMemberModal from '@/app/components/management/EditMemberModal'
import DeleteMemberModal from '@/app/components/management/DeleteMemberModal'
import EditTeamModal from '@/app/components/team/EditTeamModal'
import { getTeamMembers, type TeamMember } from '@/team/management'

export default function ManagerTeamPage() {
  const { currentTeam, user } = useTeam()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  // États pour les modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditTeamModal, setShowEditTeamModal] = useState(false)  
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null)

  const isSuperadmin = user?.permission === 'superadmin'
  const isOwner = currentTeam?.role === 'owner' || isSuperadmin
  const isManager = currentTeam?.role === 'manager' || isOwner
  const isManagerOrOwner = currentTeam?.role === 'manager' || currentTeam?.role === 'owner' || isSuperadmin

  useEffect(() => {
    setMounted(true)
  }, [])

  // Rediriger les superadmin vers leur page
  useEffect(() => {
    if (user?.permission === 'superadmin') {
      router.push('/dashboard/superadmin')
      return
    }
    if (currentTeam && !isManagerOrOwner) {
      router.push('/dashboard')
    }
  }, [user, currentTeam, isManagerOrOwner, router])

  useEffect(() => {
    if (!currentTeam || !isManagerOrOwner || user?.permission === 'superadmin') {
      return
    }
    fetchTeamMembers()
  }, [currentTeam, isManagerOrOwner, user])

  const fetchTeamMembers = async () => {
    if (!currentTeam?.team?.id) return

    setLoading(true)
    setError(null)

    try {
      const result = await getTeamMembers(currentTeam.team.id.toString())

      if (result.success && result.data) {
        setTeamMembers(result.data)
      } else {
        setError(result.message || 'Erreur lors de la récupération des membres')
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Erreur lors de la récupération des membres')
    } finally {
      setLoading(false)
    }
  }

  const canEditMember = (member: TeamMember) => {
    if (!currentTeam) return false
    
    // Superadmin can edit anyone
    if (isSuperadmin) return true
    
    // Owner can edit anyone except other owners
    if (isOwner) {
      return true
    }
    
    // Manager can only edit employees
    if (currentTeam.role === 'manager') {
      return member.role === 'employee'
    }
    
    return false
  }

  const canDeleteMember = (member: TeamMember) => {
    if (!currentTeam) return false
    
    // Superadmin can delete anyone
    if (isSuperadmin) return true
    
    // Owner can delete anyone except themselves and other owners
    if (isOwner) {
      return member.role !== 'owner' && member.user.id !== user?.id
    }
    
    // Manager can only delete employees
    if (currentTeam.role === 'manager') {
      return member.role === 'employee'
    }
    
    return false
  }

  const canViewKpi = (member: TeamMember) => {
    // Superadmin can view all KPIs
    if (isSuperadmin) return true
    
    // Cannot view KPI of owners (unless superadmin)

    return ( member.role !== 'owner' && member.role!=='manager') || (currentTeam?.role === 'owner' && member.role !=='owner')
  }

  // Gestion des succès des modals
  const handleAddSuccess = (newMember: any) => {
    setTeamMembers(prev => [...prev, newMember])
    setShowAddModal(false)
  }

  const handleEditSuccess = (updatedMember: TeamMember) => {
    setTeamMembers(prev => prev.map(m => 
      m.user.id === updatedMember.user.id ? updatedMember : m
    ))
    setShowEditModal(false)
    setEditingMember(null)
  }

  const handleDeleteSuccess = () => {
    if (deletingMember) {
      setTeamMembers(prev => prev.filter(m => m.user.id !== deletingMember.user.id))
    }
    setShowDeleteModal(false)
    setDeletingMember(null)
  }

  const handleEditTeamSuccess = () => {
    setShowEditTeamModal(false)
    window.location.reload()
  }

  // Ouvrir les modals
  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setShowEditModal(true)
  }

  const openDeleteModal = (member: TeamMember) => {
    setDeletingMember(member)
    setShowDeleteModal(true)
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}` || '?'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500 text-white'
      case 'manager':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-green-500 text-white'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire'
      case 'manager':
        return 'Manager'
      default:
        return 'Employé'
    }
  }

  if (!currentTeam || !isManagerOrOwner) {
    return null
  }

  const filteredMembers = teamMembers.filter(member =>
    member.user.first_name.toLowerCase().includes(search.toLowerCase()) ||
    member.user.last_name.toLowerCase().includes(search.toLowerCase()) ||
    member.user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className={`max-w-7xl mx-auto transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/teams')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Retour aux équipes</span>
          </button>
        </div>

        {/* Team Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)]">
              <BuildingOffice2Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-3 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                    {currentTeam.team.name}
                  </h1>
                  <button
                    onClick={() => setShowEditTeamModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-white rounded-lg transition-all duration-300 hover:shadow-lg whitespace-nowrap w-full sm:w-auto"
                  >
                    <PencilIcon className="w-5 h-5" />
                    <span className="font-medium">Modifier l&apos;équipe</span>
                  </button>
                </div>
              </div>
              {currentTeam.team.description && (
                <p className="text-gray-600">{currentTeam.team.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{teamMembers.length} membre{teamMembers.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* Members List */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '100ms' }}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Membres de l&apos;équipe ({teamMembers.length})
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] hover:from-[#ff6b4a] hover:to-[var(--color-primary)] text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Ajouter un employé</span>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="px-6 py-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

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

          {/* List Items */}
          {!loading && !error && filteredMembers.length > 0 && (
            <div className="divide-y divide-gray-100">
              {filteredMembers.map((member, index) => (
                <div
                  key={member.user.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-all duration-300 ${
                    mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative w-11 h-11 rounded-full overflow-hidden bg-gray-100 group">
                    <Image 
                      src={`https://api.dicebear.com/5.x/initials/svg?seed=${member.user.first_name[0]}${member.user.last_name[0]}`} 
                      alt='Image de profile' 
                      width={44} 
                      height={44} 
                      className="relative rounded-full border-2 border-white/20 transform transition-transform duration-300 group-hover:scale-110" 
                    />
                    </div>

                    {/* Info - flex-1 with min-width 0 for proper text truncation */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {member.user.first_name} {member.user.last_name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getRoleColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                        {member.user.phonenumber && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <PhoneIcon className="w-4 h-4" />
                            <span>{member.user.phonenumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canViewKpi(member) && (
                        <button
                          onClick={() => {
                            router.push(`/dashboard/kpi?userId=${member.user.id}`)
                          }}
                          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                          title="Voir KPI"
                        >
                                    
                          <ChartBarIcon className="w-5 h-5" />
                        </button>
                       )}
                      {canEditMember(member) && (
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canDeleteMember(member) && (
                        <button
                          onClick={() => openDeleteModal(member)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        teamId={currentTeam.team.id.toString()}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <EditMemberModal
        member={editingMember}
        teamId={currentTeam.team.id.toString()}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingMember(null)
        }}
        onSuccess={handleEditSuccess}
      />

      <DeleteMemberModal
        member={deletingMember}
        teamId={currentTeam.team.id.toString()}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingMember(null)
        }}
        onSuccess={handleDeleteSuccess}
      />

      <EditTeamModal
        team={currentTeam}
        isOpen={showEditTeamModal}
        onClose={() => setShowEditTeamModal(false)}
        onSuccess={handleEditTeamSuccess}
      />
    </main>
  )
}