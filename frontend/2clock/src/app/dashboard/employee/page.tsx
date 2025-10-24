"use client"
import React from 'react'
import Link from 'next/link'
import { ClockIcon, UserIcon, ChartBarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'

export default function EmployeePage() {
  const { currentTeam, user } = useTeam()

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-[rgba(236,77,54,0.06)]">
            <ClockIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
              Bienvenue, {user?.first_name || 'Employé(e)'}
            </h1>
            <p className="text-gray-600">Accédez à vos pointages et gérez votre temps de travail</p>
            
            {currentTeam && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-2 rounded-lg bg-blue-50">
                  <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{currentTeam.team.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      currentTeam.role === 'manager' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {currentTeam.role === 'manager' ? 'Responsable' : 'Employé'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex flex-wrap gap-4">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {currentTeam.team.timezone}
                      </span>
                      <span>Limite retard: {currentTeam.team.lateness_limit} min</span>
                      {currentTeam.team.description && (
                        <span>{currentTeam.team.description}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/clock">
          <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid var(--color-primary)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(236,77,54,0.08)' }}>
                <ClockIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Pointer</h2>
              <p className="text-gray-600">Enregistrez vos heures de travail</p>
            </div>
          </article>
        </Link>

        <Link href="/dashboard/employee/profile">
          <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #7a5bdc' }}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(122,91,220,0.08)' }}>
                <UserIcon className="w-8 h-8" style={{ color: '#7a5bdc' }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Profil</h2>
              <p className="text-gray-600">Gérez vos informations</p>
            </div>
          </article>
        </Link>

        <Link href="/dashboard/employee/punches">
          <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #3bb273' }}>
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(59,178,115,0.08)' }}>
                <ChartBarIcon className="w-8 h-8" style={{ color: '#3bb273' }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Statistiques</h2>
              <p className="text-gray-600">Visualisez vos temps de travail</p>
            </div>
          </article>
        </Link>
      </div>
    </main>
  )
}