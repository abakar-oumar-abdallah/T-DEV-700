import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  count?: number
  color: 'blue' | 'green' | 'orange' | 'red'
  icon: React.ReactNode
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

// Composant (stylistique) de carte de statistique individuelle
export default function StatCard({ label, value, count, color, icon }: StatCardProps) {
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