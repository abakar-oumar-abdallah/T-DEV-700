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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                {user.first_name}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                {user.last_name}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                {user.phonenumber??'Aucun numéro fourni.'}
              </div>
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                {user.permission}
              </div>
            </div> */}
          </div>
        )}
      </div>
    </main>
  )
}