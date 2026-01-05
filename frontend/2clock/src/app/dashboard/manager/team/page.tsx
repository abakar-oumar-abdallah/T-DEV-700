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
  ChevronRightIcon
} from '@heroicons/react/24/outline'

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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Membres de l'équipe ({teamMembers.length})
              </h2>
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
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(member.role)} shadow-sm`}>
                        {getRoleLabel(member.role)}
                      </span>
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
              <p className="text-gray-500">Cette équipe n&apos;a pas encore de membres.</p>
            </div>
          )}
        </>
      )}
    </main>
  )
}