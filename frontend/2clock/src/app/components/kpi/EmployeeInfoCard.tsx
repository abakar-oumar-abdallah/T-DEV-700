import React from 'react'
import Image from 'next/image'
import type { UserTeam, LatenessData } from '@/kpi/kpi'

interface EmployeeInfoCardProps {
  selectedUser: UserTeam
  latenessData: LatenessData
  mounted: boolean
}

// Composant affichant les informations de l'employé sélectionné (kpi)
export default function EmployeeInfoCard({ selectedUser, latenessData, mounted }: EmployeeInfoCardProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 mb-8 border border-blue-200 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-shrink-0">
          <Image 
            src={`https://api.dicebear.com/5.x/initials/svg?seed=${selectedUser.user.first_name[0]}${selectedUser.user.last_name[0]}`} 
            alt={`${selectedUser.user.first_name} ${selectedUser.user.last_name}`} 
            width={64} 
            height={64} 
            className="rounded-full border-2 border-blue-200" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {selectedUser.user.first_name} {selectedUser.user.last_name}
            </h3>
            <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-medium ${
              selectedUser.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {selectedUser.role === 'manager' ? 'Manager' : 'Employé'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2 truncate">{selectedUser.user.email}</p>
          <div className="text-sm text-gray-600">
            {latenessData.period.days === 'all' 
              ? `Toutes les données • ${latenessData.totalClocks} pointages au total`
              : latenessData.period.days 
              ? `${latenessData.period.days} derniers jours • ${latenessData.totalClocks} pointages`
              : `Du ${latenessData.period.start} au ${latenessData.period.end} • ${latenessData.totalClocks} pointages`
            }
          </div>
        </div>
      </div>
    </div>
  )
}