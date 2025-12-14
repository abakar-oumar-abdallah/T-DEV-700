"use client"
import React, { useState, useEffect } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChartBarIcon, ClockIcon, UserIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
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
  const [days, setDays] = useState<number | null>(30)
  const [appliedDays, setAppliedDays] = useState<number | null>(30)
  const [customDays, setCustomDays] = useState('30')
  const [pendingDays, setPendingDays] = useState('30')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [latenessData, setLatenessData] = useState<LatenessData | null>(null)

  const isManager = currentTeam?.role === 'manager'
  const selectedUser = teamMembers.find(m => m.user.id === selectedUserId)
  const overallScore = latenessData ? latenessData.onTime.percentage + latenessData.early.percentage : 0

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
    getLatenessRateByEmployee(currentTeam.team.id, selectedUserId, appliedDays).then(r => {
      if (r.success && r.data) setLatenessData(r.data)
      else setError(r.error || 'Erreur chargement données')
    }).finally(() => setLoading(false))
  }, [currentTeam?.team.id, selectedUserId, appliedDays])

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true)
      setPendingDays(customDays)
    } else if (value === 'all') {
      setShowCustomInput(false)
      setDays(null)
      setCustomDays('all')
      setPendingDays('all')
    } else {
      setShowCustomInput(false)
      const daysValue = parseInt(value)
      setDays(daysValue)
      setCustomDays(value)
      setPendingDays(value)
    }
  }

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === '' || /^\d+$/.test(v)) {
      setPendingDays(v)
      if (v !== '' && parseInt(v) >= 1) {
        setError(null)
      } else if (v !== '') {
        setError('Le nombre de jours doit être supérieur ou égal à 1')
      }
    }
  }

  const applyCustomDays = () => {
    const numValue = parseInt(pendingDays)
    if (isNaN(numValue) || numValue < 1) {
      setPendingDays('1')
      setDays(1)
      setCustomDays('1')
    } else {
      setDays(numValue)
      setCustomDays(pendingDays)
      setError(null)
    }
  }

  const handleCustomDaysBlur = () => {
    if (!pendingDays) {
      setPendingDays('30')
      setCustomDays('30')
      setDays(30)
      setShowCustomInput(false)
    } else {
      const numValue = parseInt(pendingDays)
      if (isNaN(numValue) || numValue < 1) {
        setPendingDays('1')
        setCustomDays('1')
      } else {
        setCustomDays(pendingDays)
      }
    }
  }

  const handleCustomDaysKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applyCustomDays()
      if (selectedUserId && currentTeam?.team.id) {
        setAppliedDays(days)
      }
    }
  }

  const handleRefresh = () => {
    if (showCustomInput) applyCustomDays()
    if (selectedUserId && currentTeam?.team.id) {
      setAppliedDays(days)
    }
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">KPI de Ponctualité</h1>
              <p className="text-gray-600 mt-1">Analysez les statistiques de ponctualité</p>
            </div>
          </div>
          {currentTeam && <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-sm font-medium text-gray-700">Équipe: {currentTeam.team.name}</span></div>}
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-xl shadow-md p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2"><UserIcon className="w-4 h-4 inline mr-2" />Employé</label>
            <select value={selectedUserId || ''} onChange={(e) => setSelectedUserId(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]" disabled={loading}>
              <option value="">Sélectionner un employé</option>
              {teamMembers.map((m, i) => <option key={`m-${m.user.id}-${i}`} value={m.user.id}>{m.user.first_name} {m.user.last_name} ({m.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-2" />
              Période {showCustomInput && <span className="text-xs text-gray-500">(min. 1 jour)</span>}
            </label>
            {showCustomInput ? (
              <div className="relative">
                <input 
                  type="text" 
                  value={pendingDays} 
                  onChange={handleCustomDaysChange} 
                  onBlur={handleCustomDaysBlur}
                  onKeyDown={handleCustomDaysKeyDown}
                  placeholder="Entrez un nombre (min. 1)" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] pr-20" 
                  disabled={loading} 
                  autoFocus 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">jours</span>
              </div>
            ) : (
              <select value={customDays} onChange={(e) => handlePeriodChange(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]" disabled={loading}>
                {[7, 14, 30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} derniers jours{d === 365 ? ' (1 an)' : ''}</option>)}
                <option value="all">Toutes les données</option>
                <option value="custom">Période personnalisée...</option>
              </select>
            )}
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleRefresh} 
              disabled={loading || !selectedUserId} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />Actualiser
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"><p className="text-sm text-red-800">{error}</p></div>}
      {loading && !latenessData && <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div></div>}

      {!loading && latenessData && selectedUser && (
        <>
          {/* Employee Info */}
          <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-4">
              <div className="relative"><Image src={`https://api.dicebear.com/5.x/initials/svg?seed=${selectedUser.user.first_name[0]}${selectedUser.user.last_name[0]}`} alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`} width={48} height={48} className="rounded-full border-2 border-blue-200" /></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.user.first_name} {selectedUser.user.last_name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.user.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedUser.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{selectedUser.role === 'manager' ? 'Manager' : 'Employé'}</span>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {latenessData.period.days === 'all' 
                ? `Toutes les données • ${latenessData.totalClocks} pointages au total`
                : `Période: ${latenessData.period.startDate} au ${latenessData.period.endDate} (${latenessData.period.days} jours)`
              }
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total pointages" value={latenessData.totalClocks} color="blue" icon={<ClockIcon className="w-6 h-6 text-blue-600" />} />
            <StatCard label="À l'heure" value={`${latenessData.onTime.percentage.toFixed(1)}%`} count={latenessData.onTime.count} color="green" icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
            <StatCard label="Retards légers" value={`${latenessData.warning.percentage.toFixed(1)}%`} count={latenessData.warning.count} color="orange" icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />} />
            <StatCard label="Retards graves" value={`${latenessData.graveLateness.percentage.toFixed(1)}%`} count={latenessData.graveLateness.count} color="red" icon={<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          </div>

          <KpiGraphs latenessData={latenessData} mounted={mounted} />

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Résumé</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-700">Score global</span><span className="text-2xl font-bold text-gray-900">{overallScore.toFixed(1)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}></div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200"><p className="text-sm font-medium text-green-800">Points positifs</p><p className="text-xs text-green-700">{latenessData.onTime.count + latenessData.early.count} pointages OK</p></div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200"><p className="text-sm font-medium text-red-800">Points d'attention</p><p className="text-xs text-red-700">{latenessData.warning.count + latenessData.graveLateness.count} retards</p></div>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !latenessData && !error && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><ChartBarIcon className="w-8 h-8 text-gray-400" /></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedUserId ? 'Aucune donnée' : 'Sélectionnez un employé'}</h3>
          <p className="text-gray-600">{selectedUserId ? 'Aucun pointage trouvé.' : 'Choisissez un employé pour voir ses stats.'}</p>
        </div>
      )}
    </main>
  )
}