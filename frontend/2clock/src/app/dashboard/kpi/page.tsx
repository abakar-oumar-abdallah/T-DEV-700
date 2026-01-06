"use client"
import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { getLatenessRateByEmployee, getDepartureRateByEmployee, getTeamMembers } from '@/kpi/kpi'
import type { LatenessData, UserTeam } from '@/kpi/kpi'
import KpiGraphs from '@/app/components/kpi/KpiGraphs'
import KpiFilters from '@/app/components/kpi/KpiFilters'
import EmployeeInfoCard from '@/app/components/kpi/EmployeeInfoCard'
import KpiStats from '@/app/components/kpi/KpiStats'

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

  const [periodMode, setPeriodMode] = useState<'days' | 'all' | 'range'>('days')
  const [customDays, setCustomDays] = useState('30')
  const [appliedDays, setAppliedDays] = useState(30)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')

  const [latenessData, setLatenessData] = useState<LatenessData | null>(null)

  const isManager = currentTeam?.role === 'manager'
  const selectedUser = teamMembers.find(m => m.user.id === selectedUserId)

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
    const fetcher = kpiType === 'lateness' ? getLatenessRateByEmployee : getDepartureRateByEmployee
    fetcher(currentTeam.team.id, selectedUserId, options).then(r => {
      if (r.success && r.data) setLatenessData(r.data)
      else setError(r.error || 'Erreur chargement données')
    }).finally(() => setLoading(false))
  }, [currentTeam?.team.id, selectedUserId, appliedDays, appliedStartDate, appliedEndDate, periodMode, kpiType])

  const handlePeriodModeChange = (value: 'days' | 'all' | 'range') => {
    setPeriodMode(value)
    setError(null)
    if (value === 'range') {
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

  if (!currentTeam || !isManager) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 text-center transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
        </div>
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
            <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] hover:scale-105 duration-300">
              <ChartBarIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            </div>
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
          {currentTeam && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Équipe: {currentTeam.team.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <KpiFilters
        kpiType={kpiType}
        setKpiType={setKpiType}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        teamMembers={teamMembers}
        periodMode={periodMode}
        setPeriodMode={handlePeriodModeChange}
        customDays={customDays}
        handleCustomDaysChange={handleCustomDaysChange}
        handleCustomDaysBlur={handleCustomDaysBlur}
        handleCustomDaysKeyDown={handleCustomDaysKeyDown}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        handleRefresh={handleRefresh}
        loading={loading}
        mounted={mounted}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && !latenessData && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      )}

      {!loading && latenessData && selectedUser && (
        <>
          <EmployeeInfoCard selectedUser={selectedUser} latenessData={latenessData} mounted={mounted} />
          <KpiStats latenessData={latenessData} kpiType={kpiType} mounted={mounted} />
          <KpiGraphs latenessData={latenessData} mounted={mounted} kpiType={kpiType} />
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