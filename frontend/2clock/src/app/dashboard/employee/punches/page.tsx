"use client"
import React from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function PunchesPage() {
  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-[rgba(59,178,115,0.06)]">
            <ChartBarIcon className="w-6 h-6" style={{ color: '#3bb273' }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Statistiques</h1>
            <p className="text-gray-600">Visualisez vos temps de travail</p>
          </div>
        </div>

        <div className="text-center py-12 text-gray-500">
          <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Les statistiques de pointage seront affichées ici</p>
        </div>
      </div>
    </main>
  )
}