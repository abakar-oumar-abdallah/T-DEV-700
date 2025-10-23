"use client"
import React, { useState, useEffect } from 'react'
import { ChartBarIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
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

export default function PunchesPage() {
  const { currentTeam, user } = useTeam()
  const [selectedWeek, setSelectedWeek] = useState('Cette semaine')

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-[rgba(59,178,115,0.06)]">
              <ChartBarIcon className="w-6 h-6" style={{ color: '#3bb273' }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Statistiques</h1>
              <p className="text-gray-600">Visualisez vos temps de travail</p>
            </div>
          </div>
          
          {/* Week selector */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Cette semaine</option>
              <option>Semaine dernière</option>
              <option>Il y a 2 semaines</option>
              <option>Il y a 3 semaines</option>
            </select>
          </div>
        </div>

        {/* Current team info */}
        {currentTeam && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Équipe actuelle: {currentTeam.team.name}</span>
              <span className="text-xs text-gray-500">({currentTeam.role === 'manager' ? 'Responsable' : 'Employé'})</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures totales</p>
              <p className="text-2xl font-semibold text-gray-900">{weekStats.totalHours}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: weekStats.efficiency }}></div>
              </div>
              <span className="ml-3 text-sm text-gray-600">{weekStats.efficiency}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heures attendues</p>
              <p className="text-2xl font-semibold text-gray-900">{weekStats.expectedHours}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Efficacité: <span className="font-medium text-green-600">{weekStats.efficiency}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Arrivée moyenne</p>
              <p className="text-2xl font-semibold text-gray-900">{weekStats.avgArrival}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {weekStats.latedays > 0 ? (
              <span className="text-orange-600">{weekStats.latedays} jour(s) de retard</span>
            ) : (
              <span className="text-green-600">Aucun retard</span>
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jours travaillés</p>
              <p className="text-2xl font-semibold text-gray-900">{mockData.length}/5</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Présence: <span className="font-medium text-blue-600">100%</span>
          </p>
        </div>
      </div>

      {/* Daily Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Détail quotidien</h3>
          <p className="text-sm text-gray-600">Heures de travail par jour cette semaine</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retard</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {day.day}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      day.status === 'Complet' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {day.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.late > 0 ? (
                      <span className="text-red-600">+{day.late} min</span>
                    ) : (
                      <span className="text-green-600">À l'heure</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}