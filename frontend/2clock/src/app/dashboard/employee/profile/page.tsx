"use client"
import React from 'react'
import { UserIcon } from '@heroicons/react/24/outline'
import { useTeam } from '@/contexts/TeamContext'

export default function ProfilePage() {
  const { user } = useTeam()

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-[rgba(122,91,220,0.06)]">
            <UserIcon className="w-6 h-6" style={{ color: '#7a5bdc' }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>
        </div>

        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prénom</label>
                <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {user.first_name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {user.last_name}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
                  {user.permission}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}