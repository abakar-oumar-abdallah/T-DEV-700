"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClockIcon, UserIcon, ChartBarIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'

export default function EmployeePage() {
  const { currentTeam, user } = useTeam()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className={`relative bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Decorative gradient blob */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgba(255,107,74,0.12)] to-transparent opacity-80 pointer-events-none blur-3xl" />
        
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-transform hover:scale-105 duration-300">
            <ClockIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
              Bienvenue, {user?.first_name || 'Employé(e)'}
            </h1>
            <p className="text-gray-600 mt-1">Accédez à vos pointages et gérez votre temps de travail</p>
            
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
        <Link href="/dashboard/clock" className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
          <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[var(--color-primary)] hover:-translate-y-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(236,77,54,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <ClockIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Pointer</h2>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Enregistrez vos heures de travail</p>
            </div>
          </article>
        </Link>

        <Link href="/dashboard/employee/profile" className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
          <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[#7a5bdc] hover:-translate-y-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(122,91,220,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(122,91,220,0.12)] to-[rgba(122,91,220,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <UserIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: '#7a5bdc' }} />
              </div>
              <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Profil</h2>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Gérez vos informations</p>
            </div>
          </article>
        </Link>

        <Link href="/dashboard/employee/punches" className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
          <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[#3bb273] hover:-translate-y-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,178,115,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(59,178,115,0.12)] to-[rgba(59,178,115,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <ChartBarIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: '#3bb273' }} />
              </div>
              <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Statistiques</h2>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Visualisez vos temps de travail</p>
            </div>
          </article>
        </Link>
      </div>
    </main>
  )
}