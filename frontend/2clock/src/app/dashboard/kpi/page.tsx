"use client"
import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { getLatenessRateByEmployee, getTeamMembers } from '@/kpi/kpi'
import type { LatenessData, UserTeam } from '@/kpi/kpi'
import KpiGraphs from '@/app/components/KpiGraphs'

export default function KpiPage() {
  const { currentTeam, user } = useTeam()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<UserTeam[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [days, setDays] = useState<number>(30)
  const [customDays, setCustomDays] = useState<string>('30')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [latenessData, setLatenessData] = useState<LatenessData | null>(null)

  // Mount animation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is manager
  const isManager = currentTeam?.role === 'manager'

  // Redirect if not manager
  useEffect(() => {
    if (currentTeam && !isManager) {
      router.push('/dashboard/employee')
    }
  }, [currentTeam, isManager, router])

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!currentTeam?.team.id || !isManager) return

      setLoading(true)
      setError(null)

      const result = await getTeamMembers(currentTeam.team.id)
      
      if (result.success && result.data) {
        setTeamMembers(result.data)
        // DO NOT select first employee by default - removed this line
      } else {
        setError(result.error || 'Erreur lors du chargement des membres de l\'équipe')
      }
      
      setLoading(false)
    }

    loadTeamMembers()
  }, [currentTeam?.team.id, isManager])

  // Load lateness data when user or days change
  useEffect(() => {
    const loadLatenessData = async () => {
      // Only load if user is explicitly selected
      if (!currentTeam?.team.id || !selectedUserId) return

      setLoading(true)
      setError(null)

      const result = await getLatenessRateByEmployee(currentTeam.team.id, selectedUserId, days)
      
      if (result.success && result.data) {
        setLatenessData(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des données de ponctualité')
      }
      
      setLoading(false)
    }

    loadLatenessData()
  }, [currentTeam?.team.id, selectedUserId, days])

  // Handle period selection change
  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true)
    } else {
      setShowCustomInput(false)
      const daysValue = parseInt(value)
      setDays(daysValue)
      setCustomDays(value)
    }
  }

  // Handle custom days input
  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setCustomDays(value)
      
      // Validate and set days
      const numValue = parseInt(value)
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 365) {
        setDays(numValue)
        setError(null)
      } else if (value !== '') {
        setError('Le nombre de jours doit être entre 1 et 365')
      }
    }
  }

  // Handle custom days blur (when user leaves input)
  const handleCustomDaysBlur = () => {
    if (customDays === '') {
      setCustomDays('30')
      setDays(30)
      setShowCustomInput(false)
    } else {
      const numValue = parseInt(customDays)
      if (isNaN(numValue) || numValue < 1) {
        setCustomDays('1')
        setDays(1)
      } else if (numValue > 365) {
        setCustomDays('365')
        setDays(365)
      }
    }
  }

  // Get selected user info
  const selectedUser = teamMembers.find(member => member.user.id === selectedUserId)

  // Calculate overall score safely
  const overallScore = latenessData 
    ? (latenessData.onTime.percentage + latenessData.early.percentage)
    : 0

  // Access denied if not manager
  if (!currentTeam || !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className={`bg-white rounded-2xl shadow-2xl p-8 text-center transition-all duration-700 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès Restreint</h1>
            <p className="text-gray-600">Seuls les managers peuvent accéder aux KPI de l&apos;équipe.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      {/* Header */}
      <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-transparent opacity-80 pointer-events-none blur-3xl" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-transform hover:scale-105 duration-300">
              <ChartBarIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                KPI de Ponctualité
              </h1>
              <p className="text-gray-600 mt-1">Analysez les statistiques de ponctualité de votre équipe</p>
            </div>
          </div>

          {/* Team Info */}
          {currentTeam && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Équipe: {currentTeam.team.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-xl shadow-md p-6 mb-8 transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} style={{ transitionDelay: '100ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-2" />
              Employé
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              disabled={loading}
            >
              <option value="">Sélectionner un employé</option>
              {teamMembers.map((member, index) => (
                <option key={`member-${member.user.id}-${index}`} value={member.user.id}>
                  {member.user.first_name} {member.user.last_name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-2" />
              Période (jours)
            </label>
            {showCustomInput ? (
              <div className="relative">
                <input
                  type="text"
                  value={customDays}
                  onChange={handleCustomDaysChange}
                  onBlur={handleCustomDaysBlur}
                  placeholder="Nombre de jours (1-365)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent pr-20"
                  disabled={loading}
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  jours
                </span>
              </div>
            ) : (
              <select
                value={customDays}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                disabled={loading}
              >
                <option value={7}>7 derniers jours</option>
                <option value={14}>14 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={60}>60 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={180}>180 derniers jours</option>
                <option value={365}>365 derniers jours (1 an)</option>
                <option value="custom">Période personnalisée...</option>
              </select>
            )}
            {showCustomInput && (
              <p className="text-xs text-gray-500 mt-1">
                Entre 1 et 365 jours
              </p>
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                if (selectedUserId && currentTeam?.team.id) {
                  setLatenessData(null)
                  setLoading(true)
                  getLatenessRateByEmployee(currentTeam.team.id, selectedUserId, days)
                    .then(result => {
                      if (result.success && result.data) {
                        setLatenessData(result.data)
                      } else {
                        setError(result.error || 'Erreur lors du chargement')
                      }
                    })
                    .finally(() => setLoading(false))
                }
              }}
              disabled={loading || !selectedUserId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-8 transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !latenessData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      )}

      {/* Data Display */}
      {!loading && latenessData && selectedUser && (
        <>
          {/* Employee Info  */}
          <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <div className="flex items-center gap-4">
              {/* Profile Picture  */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full opacity-50" />
                <Image 
                  src={`https://api.dicebear.com/5.x/initials/svg?seed=${selectedUser.user.first_name.substr(0, 1)}${selectedUser.user.last_name.substr(0, 1)}`} 
                  alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`}
                  width={48} 
                  height={48} 
                  className="relative rounded-full border-2 border-blue-200" 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedUser.user.first_name} {selectedUser.user.last_name}
                </h3>
                <p className="text-sm text-gray-600">{selectedUser.user.email}</p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedUser.role === 'manager' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedUser.role === 'manager' ? 'Manager' : 'Employé'}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Période analysée: {latenessData.period.startDate} au {latenessData.period.endDate} ({latenessData.period.days} jours)
            </div>
          </div>

          {/* Summary Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '300ms' }}>
            {/* Total Clocks */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total pointages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{latenessData.totalClocks}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* On Time */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">À l&apos;heure</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{latenessData.onTime.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{latenessData.onTime.count} pointages</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retards légers</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{latenessData.warning.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{latenessData.warning.count} pointages</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Grave Lateness */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retards graves</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{latenessData.graveLateness.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">{latenessData.graveLateness.count} pointages</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Component */}
          <KpiGraphs latenessData={latenessData} mounted={mounted} />

          {/* Performance Summary */}
          <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Résumé de la performance</h3>
            
            <div className="space-y-4">
              {/* Overall Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Score global de ponctualité</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {overallScore.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}
                  ></div>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-1">Points positifs</p>
                  <p className="text-xs text-green-700">
                    {latenessData.onTime.count + latenessData.early.count} pointages à l&apos;heure ou en avance
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-1">Points d&apos;attention</p>
                  <p className="text-xs text-red-700">
                    {latenessData.warning.count + latenessData.graveLateness.count} pointages en retard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data state - IMPROVED MESSAGE */}
      {!loading && !latenessData && !error && (
        <div className={`bg-white rounded-xl shadow-lg p-12 text-center transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '200ms' }}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedUserId ? 'Aucune donnée disponible' : 'Sélectionnez un employé'}
          </h3>
          <p className="text-gray-600">
            {selectedUserId 
              ? 'Aucun pointage trouvé pour la période sélectionnée.'
              : 'Veuillez sélectionner un employé dans le menu déroulant pour afficher ses statistiques de ponctualité.'}
          </p>
        </div>
      )}
    </main>
  )
}