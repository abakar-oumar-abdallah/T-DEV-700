"use client"
import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChartBarIcon, ClockIcon, UserIcon, ExclamationTriangleIcon, ArrowPathIcon, CalendarIcon, ArrowLeftIcon, PlusIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { getLatenessRateByEmployee, getDepartureRateByEmployee, getTeamMembers } from '@/kpi/kpi'
import type { LatenessData, UserTeam } from '@/kpi/kpi'
import KpiGraphs from '@/app/components/KpiGraphs'

type KpiType = 'lateness' | 'departure'

export default function KpiPage() {
  const { currentTeam, user } = useTeam()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<UserTeam[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [kpiType, setKpiType] = useState<KpiType>('lateness')

  // Period mode: 'days' | 'all' | 'range'
  const [periodMode, setPeriodMode] = useState<'days' | 'all' | 'range'>('days')
  // Days mode
  const [customDays, setCustomDays] = useState('30')
  const [appliedDays, setAppliedDays] = useState(30)
  // Date range mode
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')

  const [latenessData, setLatenessData] = useState<LatenessData | null>(null)

  const isManager = currentTeam?.role === 'manager'
  const selectedUser = teamMembers.find(m => m.user.id === selectedUserId)
  const overallScore = latenessData
    ? latenessData.onTime.percentage + latenessData.early.percentage
    : 0

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (currentTeam && !isManager) router.push('/dashboard/employee') }, [currentTeam, isManager, router])

  useEffect(() => {
    if (!currentTeam?.team.id || !isManager) return
    setLoading(true)
    getTeamMembers(currentTeam.team.id).then(r => {
      if (r.success && r.data) setTeamMembers(r.data)
      else setError(r.error || 'Erreur chargement membres')
    }).finally(() => setLoading(false))
  }, [currentTeam?.team.id, isManager])

  useEffect(() => {
    if (!currentTeam?.team.id || !selectedUserId) return
    setLoading(true)
    setError(null)
    let options: { days?: number | null; startDate?: string; endDate?: string } = {}
    if (periodMode === 'all') {
      options = { days: null }
    } else if (periodMode === 'days') {
      options = { days: appliedDays }
    } else if (periodMode === 'range') {
      if (!appliedStartDate || !appliedEndDate) {
        setLoading(false)
        return
      }
      options = { startDate: appliedStartDate, endDate: appliedEndDate }
    }
    const fetcher =
      kpiType === 'lateness'
        ? getLatenessRateByEmployee
        : getDepartureRateByEmployee
    fetcher(currentTeam.team.id, selectedUserId, options).then(r => {
      if (r.success && r.data) setLatenessData(r.data)
      else setError(r.error || 'Erreur chargement données')
    }).finally(() => setLoading(false))
  }, [currentTeam?.team.id, selectedUserId, appliedDays, appliedStartDate, appliedEndDate, periodMode, kpiType])

  const handlePeriodModeChange = (value: 'days' | 'all' | 'range') => {
    setPeriodMode(value)
    setError(null)
    if (value === 'range') {
      // Set default dates (last 30 days)
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === '' || /^\d+$/.test(v)) {
      setCustomDays(v)
      if (v !== '' && parseInt(v) >= 1) {
        setError(null)
      } else if (v !== '') {
        setError('Le nombre de jours doit être supérieur ou égal à 1')
      }
    }
  }

  const handleCustomDaysBlur = () => {
    if (!customDays || parseInt(customDays) < 1) {
      setCustomDays('30')
    }
  }

  const handleCustomDaysKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRefresh()
    }
  }

  const handleRefresh = () => {
    if (!selectedUserId || !currentTeam?.team.id) return
    setError(null)
    if (periodMode === 'days') {
      const numValue = parseInt(customDays)
      if (isNaN(numValue) || numValue < 1) {
        setError('Le nombre de jours doit être supérieur ou égal à 1')
        return
      }
      setAppliedDays(numValue)
    } else if (periodMode === 'range') {
      if (!startDate || !endDate) {
        setError('Veuillez sélectionner une date de début et de fin')
        return
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError('La date de début doit être antérieure à la date de fin')
        return
      }
      setAppliedStartDate(startDate)
      setAppliedEndDate(endDate)
    } else if (periodMode === 'all') {
      setAppliedDays(0)
      setTimeout(() => setAppliedDays(appliedDays), 0)
    }
  }

  const formatMinutes = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}min`
    }
    return `${minutes} min`
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; text: string; bg: string }> = {
      blue: { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
      green: { border: 'border-green-500', text: 'text-green-600', bg: 'bg-green-50' },
      orange: { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
      red: { border: 'border-red-500', text: 'text-red-600', bg: 'bg-red-50' }
    }
    return colors[color] || colors.blue
  }

  const StatCard = ({ label, value, count, color, icon }: any) => {
    const colorClasses = getColorClasses(color)
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${colorClasses.border} hover:shadow-lg transition-shadow`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className={`text-3xl font-bold ${colorClasses.text} mt-1`}>{value}</p>
            {count !== undefined && <p className="text-xs text-gray-500 mt-1">{count} pointages</p>}
          </div>
          <div className={`p-3 ${colorClasses.bg} rounded-lg`}>{icon}</div>
        </div>
      </div>
    )
  }

  if (!currentTeam || !isManager) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 text-center transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4"><ExclamationTriangleIcon className="w-8 h-8 text-orange-600" /></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès Restreint</h1>
        <p className="text-gray-600">Seuls les managers peuvent accéder aux KPI.</p>
      </div>
    </div>
  )

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      {/* Header */}
      <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-transparent opacity-80 blur-3xl" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] hover:scale-105 duration-300"><ChartBarIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} /></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                {kpiType === 'lateness' ? 'KPI de Ponctualité' : 'KPI de Départ'}
              </h1>
              <p className="text-gray-600 mt-1">
                {kpiType === 'lateness'
                  ? 'Analysez les statistiques de ponctualité'
                  : 'Analysez les statistiques de départ (heures de sortie)'}
              </p>
            </div>
          </div>
          {currentTeam && <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-sm font-medium text-gray-700">Équipe: {currentTeam.team.name}</span></div>}
        </div>
      </div>

            {/* Filters */}
      <div className={`bg-white rounded-xl shadow-md p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* KPI Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              Type de KPI
            </label>
            <select
              value={kpiType}
              onChange={e => setKpiType(e.target.value as KpiType)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow"
              disabled={loading}
            >
              <option value="lateness">Ponctualité (arrivées)</option>
              <option value="departure">Départ (heures de sortie)</option>
            </select>
          </div>
          {/* Employee Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-2" />
              Employé
            </label>
            <select 
              value={selectedUserId || ''} 
              onChange={(e) => setSelectedUserId(parseInt(e.target.value))} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow" 
              disabled={loading}
            >
              <option value="">Sélectionner un employé</option>
              {teamMembers.map((m, i) => (
                <option key={`m-${m.user.id}-${i}`} value={m.user.id}>
                  {m.user.first_name} {m.user.last_name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          {/* Period Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-2" />
              Type de période
            </label>
            <select 
              value={periodMode} 
              onChange={(e) => handlePeriodModeChange(e.target.value as 'days' | 'all' | 'range')} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow" 
              disabled={loading}
            >
              <option value="days">Nombre de jours</option>
              <option value="all">Toutes les données</option>
              <option value="range">Plage de dates</option>
            </select>
          </div>
          {/* Period Input */}
          {periodMode !== 'all' && (
            <div className={periodMode === 'range' ? 'col-span-full' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                {periodMode === 'days' ? 'Nombre de jours' : 'Dates'}
              </label>
              {periodMode === 'days' ? (
                <div className="relative">
                  <input 
                    type="text" 
                    value={customDays} 
                    onChange={handleCustomDaysChange} 
                    onBlur={handleCustomDaysBlur}
                    onKeyDown={handleCustomDaysKeyDown}
                    placeholder="Entrez un nombre (min. 1)" 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow pr-20" 
                    disabled={loading} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">jours</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow text-sm"
                    disabled={loading}
                  />
                  <span className="text-gray-400">→</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md transition-shadow text-sm"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {/* Refresh Button */}
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleRefresh} 
            disabled={loading || !selectedUserId} 
            className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"><p className="text-sm text-red-800">{error}</p></div>}
      {loading && !latenessData && <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div></div>}

      {!loading && latenessData && selectedUser && (
        <>
          {/* Employee Info */}
          <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image 
                  src={`https://api.dicebear.com/5.x/initials/svg?seed=${selectedUser.user.first_name[0]}${selectedUser.user.last_name[0]}`} 
                  alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`} 
                  width={48} 
                  height={48} 
                  className="rounded-full border-2 border-blue-200" 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.user.first_name} {selectedUser.user.last_name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {selectedUser.role === 'manager' ? 'Manager' : 'Employé'}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {latenessData.period.days === 'all' 
                ? `Toutes les données • ${latenessData.totalClocks} pointages au total`
                : latenessData.period.days === 'custom'
                ? `Période: ${latenessData.period.startDate} au ${latenessData.period.endDate} • ${latenessData.totalClocks} pointages`
                : `Période: ${latenessData.period.startDate} au ${latenessData.period.endDate} (${latenessData.period.days} jours)`
              }
            </div>
          </div>

          {/* Stats */}
          <div className={`p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
              Statistiques générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total pointages" value={latenessData.totalClocks} color="blue" icon={<ClockIcon className="w-6 h-6 text-blue-600" />} />
              <StatCard label="À l'heure" value={`${latenessData.onTime.percentage.toFixed(1)}%`} count={latenessData.onTime.count} color="green" icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
              <StatCard label={kpiType === 'lateness' ? 'En avance' : 'Départ en avance'} value={`${latenessData.early.percentage.toFixed(1)}%`} count={latenessData.early.count} color={kpiType === 'lateness' ? 'blue' : 'orange'} icon={<ArrowLeftIcon className={`w-6 h-6 ${kpiType === 'lateness' ? 'text-blue-600' : 'text-orange-600'}`} />} />
              {kpiType === 'lateness' ? (
                <>
                  <StatCard label="Retards légers" value={`${(latenessData.warning?.percentage ?? 0).toFixed(1)}%`} count={latenessData.warning?.count ?? 0} color="orange" icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />} />
                  <StatCard label="Retards graves" value={`${(latenessData.graveLateness?.percentage ?? 0).toFixed(1)}%`} count={latenessData.graveLateness?.count ?? 0} color="red" icon={<ExclamationCircleIcon className="w-6 h-6 text-red-600" />} />
                </>
              ) : (
                <StatCard label="Heures supplémentaires" value={`${(latenessData.overtime?.percentage ?? 0).toFixed(1)}%`} count={latenessData.overtime?.count ?? 0} color="blue" icon={<PlusIcon className="w-6 h-6 text-blue-600" />} />
              )}
            </div>
          </div>

          {/* Minutes Details Section */}
          <div className={`p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
              Détails des durées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kpiType === 'lateness' ? (
                <>
                  <StatCard label="Durée en avance" value={formatMinutes(latenessData.early.totalMinutes)} color="blue" icon={<ArrowLeftIcon className="w-6 h-6 text-blue-600" />} />
                  <StatCard label="Durée retard léger" value={formatMinutes(latenessData.warning?.totalMinutes ?? 0)} color="orange" icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />} />
                  <StatCard label="Durée retard grave" value={formatMinutes(latenessData.graveLateness?.totalMinutes ?? 0)} color="red" icon={<ExclamationCircleIcon className="w-6 h-6 text-red-600" />} />
                </>
              ) : (
                <>
                  <StatCard label="Durée départ en avance" value={formatMinutes(latenessData.early.totalMinutes)} color="orange" icon={<ArrowLeftIcon className="w-6 h-6 text-orange-600" />} />
                  <StatCard label="Durée heures supplémentaires" value={formatMinutes(latenessData.overtime?.totalMinutes ?? 0)} color="blue" icon={<PlusIcon className="w-6 h-6 text-blue-600" />} />
                </>
              )}
            </div>
          </div>

          <KpiGraphs latenessData={latenessData} mounted={mounted} kpiType={kpiType} />

          {/* Summary - peu pertinent TODO voir la pertinence */}
          {/* <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Résumé</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Score global</span>
                  <span className="text-2xl font-bold text-gray-900">{overallScore.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">Points positifs</p>
                  <p className="text-xs text-green-700">{latenessData.onTime.count + latenessData.early.count} pointages OK</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800">Points d'attention</p>
                  <p className="text-xs text-red-700">
                    {kpiType === 'lateness'
                      ? ((latenessData.warning?.count ?? 0) + (latenessData.graveLateness?.count ?? 0)) + ' retards'
                      : (latenessData.overtime?.count ?? 0) + ' heures supplémentaires'}
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </>
      )}

      {!loading && !latenessData && !error && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedUserId ? 'Aucune donnée' : 'Sélectionnez un employé'}
          </h3>
          <p className="text-gray-600">
            {selectedUserId ? 'Aucun pointage trouvé.' : 'Choisissez un employé pour voir ses stats.'}
          </p>
        </div>
      )}
    </main>
  )
}