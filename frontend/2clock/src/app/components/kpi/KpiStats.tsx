import React from 'react'
import { ClockIcon, ArrowLeftIcon, ExclamationTriangleIcon, ExclamationCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import StatCard from './StatCard'
import type { LatenessData } from '@/kpi/kpi'

interface KpiStatsProps {
  latenessData: LatenessData
  kpiType: 'lateness' | 'departure'
  mounted: boolean
}

const formatMinutes = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }
  return `${minutes} min`
}

// Composant de statistiques utilisé pour les kpis, les formattant correctement
export default function KpiStats({ latenessData, kpiType, mounted }: KpiStatsProps) {
  return (
    <>
      {/* General Stats */}
      <div className={`p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
          Statistiques générales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total pointages" 
            value={latenessData.totalClocks} 
            color="blue" 
            icon={<ClockIcon className="w-6 h-6 text-blue-600" />} 
          />
          <StatCard 
            label="À l'heure" 
            value={`${latenessData.onTime.percentage.toFixed(1)}%`} 
            count={latenessData.onTime.count} 
            color="green" 
            icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} 
          />
          <StatCard 
            label={kpiType === 'lateness' ? 'En avance' : 'Départ en avance'} 
            value={`${latenessData.early.percentage.toFixed(1)}%`} 
            count={latenessData.early.count} 
            color={kpiType === 'lateness' ? 'blue' : 'orange'} 
            icon={<ArrowLeftIcon className={`w-6 h-6 ${kpiType === 'lateness' ? 'text-blue-600' : 'text-orange-600'}`} />} 
          />
          {kpiType === 'lateness' ? (
            <>
              <StatCard 
                label="Retards légers" 
                value={`${(latenessData.warning?.percentage ?? 0).toFixed(1)}%`} 
                count={latenessData.warning?.count ?? 0} 
                color="orange" 
                icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />} 
              />
              <StatCard 
                label="Retards graves" 
                value={`${(latenessData.graveLateness?.percentage ?? 0).toFixed(1)}%`} 
                count={latenessData.graveLateness?.count ?? 0} 
                color="red" 
                icon={<ExclamationCircleIcon className="w-6 h-6 text-red-600" />} 
              />
            </>
          ) : (
            <StatCard 
              label="Heures supplémentaires" 
              value={`${(latenessData.overtime?.percentage ?? 0).toFixed(1)}%`} 
              count={latenessData.overtime?.count ?? 0} 
              color="blue" 
              icon={<PlusIcon className="w-6 h-6 text-blue-600" />} 
            />
          )}
        </div>
      </div>

      {/* Minutes Details */}
      <div className={`p-6 mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '600ms' }}>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
          Détails des durées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiType === 'lateness' ? (
            <>
              <StatCard 
                label="Durée en avance" 
                value={formatMinutes(latenessData.early.totalMinutes)} 
                color="blue" 
                icon={<ArrowLeftIcon className="w-6 h-6 text-blue-600" />} 
              />
              <StatCard 
                label="Durée retard léger" 
                value={formatMinutes(latenessData.warning?.totalMinutes ?? 0)} 
                color="orange" 
                icon={<ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />} 
              />
              <StatCard 
                label="Durée retard grave" 
                value={formatMinutes(latenessData.graveLateness?.totalMinutes ?? 0)} 
                color="red" 
                icon={<ExclamationCircleIcon className="w-6 h-6 text-red-600" />} 
              />
            </>
          ) : (
            <>
              <StatCard 
                label="Durée départ en avance" 
                value={formatMinutes(latenessData.early.totalMinutes)} 
                color="orange" 
                icon={<ArrowLeftIcon className="w-6 h-6 text-orange-600" />} 
              />
              <StatCard 
                label="Durée heures supplémentaires" 
                value={formatMinutes(latenessData.overtime?.totalMinutes ?? 0)} 
                color="blue" 
                icon={<PlusIcon className="w-6 h-6 text-blue-600" />} 
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}