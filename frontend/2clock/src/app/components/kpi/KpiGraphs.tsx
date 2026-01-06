import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { LatenessData } from '@/kpi/kpi'

interface KpiGraphsProps {
  latenessData: LatenessData
  mounted: boolean
  kpiType: 'lateness' | 'departure'
}

const COLORS_LATE = { onTime: '#10b981', early: '#3b82f6', warning: '#f59e0b', graveLateness: '#ef4444' }
const LABELS_LATE = { onTime: 'À l\'heure', early: 'En avance', warning: 'Retard léger', graveLateness: 'Retard grave' }

const COLORS_DEPART = { onTime: '#10b981', early: '#f59e0b', overtime: '#3b82f6' }
const LABELS_DEPART = { onTime: 'À l\'heure', early: 'Départ en avance', overtime: 'Heures supplémentaires' }

//Composant de graphiques utilisé pour les kpis
export default function KpiGraphs({ latenessData, mounted, kpiType }: KpiGraphsProps) {
  const formatMinutes = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}min`
    }
    return `${minutes} min`
  }

  const createChartData = () => {
    if (kpiType === 'lateness') {
      return [
        { name: LABELS_LATE.onTime, value: latenessData.onTime.count || 0, percentage: latenessData.onTime.percentage || 0, color: COLORS_LATE.onTime },
        { name: LABELS_LATE.early, value: latenessData.early.count || 0, percentage: latenessData.early.percentage || 0, color: COLORS_LATE.early, totalMinutes: latenessData.early.totalMinutes || 0 },
        { name: LABELS_LATE.warning, value: latenessData.warning?.count || 0, percentage: latenessData.warning?.percentage || 0, color: COLORS_LATE.warning, totalMinutes: latenessData.warning?.totalMinutes || 0 },
        { name: LABELS_LATE.graveLateness, value: latenessData.graveLateness?.count || 0, percentage: latenessData.graveLateness?.percentage || 0, color: COLORS_LATE.graveLateness, totalMinutes: latenessData.graveLateness?.totalMinutes || 0 }
      ]
    } else {
      return [
        { name: LABELS_DEPART.onTime, value: latenessData.onTime.count || 0, percentage: latenessData.onTime.percentage || 0, color: COLORS_DEPART.onTime },
        { name: LABELS_DEPART.early, value: latenessData.early.count || 0, percentage: latenessData.early.percentage || 0, color: COLORS_DEPART.early, totalMinutes: latenessData.early.totalMinutes || 0 },
        { name: LABELS_DEPART.overtime, value: latenessData.overtime?.count || 0, percentage: latenessData.overtime?.percentage || 0, color: COLORS_DEPART.overtime, totalMinutes: latenessData.overtime?.totalMinutes || 0 }
      ]
    }
  }

  const pieData = React.useMemo(() => createChartData().filter(item => item.value > 0), [latenessData, kpiType])
  const barData = React.useMemo(() => createChartData().map(({ name, value, color }) => ({ name, count: value, fill: color })), [latenessData, kpiType])

  const CustomTooltip = ({ active, payload }: any) => active && payload?.[0] && (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900">{payload[0].payload.name}</p>
      <p className="text-sm text-gray-600">{payload[0].payload.value} pointages ({payload[0].payload.percentage?.toFixed(1) ?? 0}%)</p>
      {payload[0].payload.totalMinutes !== undefined && <p className="text-sm text-gray-600">Durée: {formatMinutes(payload[0].payload.totalMinutes)}</p>}
    </div>
  )

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">{percentage.toFixed(0)}%</text>
  }

  const ChartCard = ({ title, delay, children }: { title: string; delay: string; children: React.ReactNode }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: delay }}>
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
        {title}
      </h3>
      {children}
    </div>
  )

  if (!latenessData) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {[1, 2].map(i => <div key={i} className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center h-96"><p className="text-gray-500">Aucune donnée disponible</p></div>)}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <ChartCard title={kpiType === 'lateness' ? "Répartition de la ponctualité" : "Répartition des départs"} delay="400ms">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={renderLabel} outerRadius={100} dataKey="value">
                {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} formatter={(value, entry: any) => <span className="text-sm">{value} ({entry.payload.percentage?.toFixed(1) ?? 0}%)</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="h-[300px] flex items-center justify-center text-gray-500">Aucune donnée disponible</div>}
      </ChartCard>

      <ChartCard title="Nombre de pointages par catégorie" delay="500ms">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip formatter={(value: any) => [`${value} pointages`, 'Nombre']} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {barData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}