import React from 'react'
import { ChartBarIcon, UserIcon, ClockIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { UserTeam } from '@/kpi/kpi'

type KpiType = 'lateness' | 'departure'
type PeriodMode = 'days' | 'all' | 'range'

interface KpiFiltersProps {
  kpiType: KpiType
  setKpiType: (type: KpiType) => void
  selectedUserId: number | null
  setSelectedUserId: (id: number | null) => void
  teamMembers: UserTeam[]
  periodMode: PeriodMode
  setPeriodMode: (mode: PeriodMode) => void
  customDays: string
  handleCustomDaysChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleCustomDaysBlur: () => void
  handleCustomDaysKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  handleRefresh: () => void
  loading: boolean
  mounted: boolean
}

// Composant utilisé pour filtrer les KPI affichés
export default function KpiFilters({
  kpiType,
  setKpiType,
  selectedUserId,
  setSelectedUserId,
  teamMembers,
  periodMode,
  setPeriodMode,
  customDays,
  handleCustomDaysChange,
  handleCustomDaysBlur,
  handleCustomDaysKeyDown,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleRefresh,
  loading,
  mounted
}: KpiFiltersProps) {
  return (
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
                {m.user.first_name} {m.user.last_name} ({m.role === 'manager' ? 'Manager' : 'Employé'})
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
            onChange={(e) => setPeriodMode(e.target.value as PeriodMode)} 
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
  )
}