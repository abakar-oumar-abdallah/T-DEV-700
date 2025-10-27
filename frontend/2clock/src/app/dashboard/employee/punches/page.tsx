"use client"
import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CalendarIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'

// Mock data for hours worked
const mockData = [
  { day: 'Lundi', date: '15 Jan', hours: '8h 15m', status: 'Complet', late: 0 },
  { day: 'Mardi', date: '16 Jan', hours: '7h 45m', status: 'Incomplet', late: 5 },
  { day: 'Mercredi', date: '17 Jan', hours: '8h 30m', status: 'Complet', late: 0 },
  { day: 'Jeudi', date: '18 Jan', hours: '8h 00m', status: 'Complet', late: 0 },
  { day: 'Vendredi', date: '19 Jan', hours: '7h 30m', status: 'Incomplet', late: 10 },
]

const weekStats = {
  totalHours: '39h 60m',
  expectedHours: '40h 00m',
  efficiency: '98%',
  avgArrival: '08:52',
  latedays: 2
}

type FilterType = 'week' | 'month' | 'custom'

export default function PunchesPage() {
  const { currentTeam, user } = useTeam()
  const [mounted, setMounted] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('week')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('Cette semaine')

  useEffect(() => {
    setMounted(true)
  }, [])

  const exportToCSV = () => {
    const headers = ['Jour', 'Date', 'Heures', 'Statut', 'Retard']
    const rows = mockData.map(d => [d.day, d.date, d.hours, d.status, d.late > 0 ? `+${d.late} min` : 'À l\'heure'])
    
    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistiques-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const applyCustomFilter = () => {
    console.log('Filtrage de', startDate, 'à', endDate)
    setShowCustomDate(false)
  }

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      {/* Header */}
      <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {/* Decorative gradient */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(59,178,115,0.12)] to-transparent opacity-80 pointer-events-none blur-3xl" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(59,178,115,0.12)] to-[rgba(59,178,115,0.05)] transform transition-transform hover:scale-105 duration-300">
              <ChartBarIcon className="w-7 h-7" style={{ color: '#3bb273' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3bb273] to-[#2d9661] bg-clip-text text-transparent">
                Statistiques
              </h1>
              <p className="text-gray-600 mt-1">Visualisez et analysez vos temps de travail</p>
            </div>
          </div>
          
          {/* Filter & Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Type Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setFilterType('week'); setShowCustomDate(false) }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  filterType === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => { setFilterType('month'); setShowCustomDate(false) }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  filterType === 'month' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => { setFilterType('custom'); setShowCustomDate(true) }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  filterType === 'custom' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Personnalisé
              </button>
            </div>

            {/* Period Selector */}
            {!showCustomDate && (
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3bb273] transition-all"
              >
                {filterType === 'week' ? (
                  <>
                    <option>Cette semaine</option>
                    <option>Semaine dernière</option>
                    <option>Il y a 2 semaines</option>
                    <option>Il y a 3 semaines</option>
                  </>
                ) : (
                  <>
                    <option>Ce mois</option>
                    <option>Mois dernier</option>
                    <option>Il y a 2 mois</option>
                    <option>Il y a 3 mois</option>
                  </>
                )}
              </select>
            )}

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-gradient-to-r from-[#3bb273] to-[#2d9661] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 group"
            >
              <ArrowDownTrayIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Modal */}
        {showCustomDate && (
          <div className={`mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 transition-all duration-300 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Période personnalisée</h3>
              </div>
              <button
                onClick={() => setShowCustomDate(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3bb273]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3bb273]"
                />
              </div>
            </div>
            <button
              onClick={applyCustomFilter}
              disabled={!startDate || !endDate}
              className="mt-4 w-full bg-gradient-to-r from-[#3bb273] to-[#2d9661] text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Appliquer le filtre
            </button>
          </div>
        )}

        {/* Current team info */}
        {currentTeam && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">Équipe: {currentTeam.team.name}</span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                currentTeam.role === 'manager' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {currentTeam.role === 'manager' ? 'Responsable' : 'Employé'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{weekStats.totalHours}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <ClockIcon className="w-7 h-7 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-semibold text-blue-600">{weekStats.efficiency}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: mounted ? weekStats.efficiency : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className={`group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures attendues</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{weekStats.expectedHours}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <ChartBarIcon className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Efficacité: <span className="font-bold text-green-600">{weekStats.efficiency}</span>
              </p>
            </div>
            <div className="px-2 py-1 bg-green-50 rounded-full">
              <span className="text-xs font-semibold text-green-700">Excellent</span>
            </div>
          </div>
        </div>

        <div className={`group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Arrivée moyenne</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{weekStats.avgArrival}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <ClockIcon className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
          <div>
            {weekStats.latedays > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-sm text-orange-600 font-medium">{weekStats.latedays} jour(s) de retard</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600 font-medium">Aucun retard</span>
              </div>
            )}
          </div>
        </div>

        <div className={`group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Jours travaillés</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{mockData.length}<span className="text-xl text-gray-400">/5</span></p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon className="w-7 h-7 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              Présence: <span className="font-bold text-purple-600">100%</span>
            </p>
            <div className="mt-2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < mockData.length ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                  style={{ transitionDelay: `${500 + i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Details */}
      <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} style={{ transitionDelay: '500ms' }}>
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Détail quotidien</h3>
          <p className="text-sm text-gray-600 mt-1">Heures de travail par jour cette semaine</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jour</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Heures</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Retard</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mockData.map((day, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-300 ${
                    mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${600 + index * 50}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{day.day}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {day.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{day.hours}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                      day.status === 'Complet' 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200' 
                        : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {day.status === 'Complet' ? '✓' : '⚠'} {day.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {day.late > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-semibold text-red-600">+{day.late} min</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-semibold text-green-600">À l'heure</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {mockData.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune donnée trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Les données apparaîtront ici une fois enregistrées</p>
          </div>
        )}
      </div>
    </main>
  )
}