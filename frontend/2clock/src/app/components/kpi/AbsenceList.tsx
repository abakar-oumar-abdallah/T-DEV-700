'use client'

import React, { useState } from 'react'
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import type { Absence, AbsencesResponse } from '@/kpi/kpi'
import FixAllAbsencesModal from './FixAllAbsencesModal'

interface AbsenceListProps {
  data: AbsencesResponse | null
  loading: boolean
  onFixAbsences: (absences: Absence[]) => Promise<void>
  onPageChange: (page: number) => void
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AbsenceList({ data, loading, onFixAbsences, onPageChange }: AbsenceListProps) {
  const [selectedAbsences, setSelectedAbsences] = useState<Set<string>>(new Set())
  const [fixing, setFixing] = useState(false)
  const [showFixAllModal, setShowFixAllModal] = useState(false)

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
        Sélectionnez un employé pour voir ses absences
      </div>
    )
  }

  const { absences, pagination, user } = data

  const toggleAbsence = (date: string) => {
    const newSelected = new Set(selectedAbsences)
    if (newSelected.has(date)) {
      newSelected.delete(date)
    } else {
      newSelected.add(date)
    }
    setSelectedAbsences(newSelected)
  }

  const toggleAll = () => {
    if (selectedAbsences.size === absences.length) {
      setSelectedAbsences(new Set())
    } else {
      setSelectedAbsences(new Set(absences.map(a => a.date)))
    }
  }

  const handleFixSelected = async () => {
    setFixing(true)
    try {
      const toFix = absences.filter(a => selectedAbsences.has(a.date))
      await onFixAbsences(toFix)
      setSelectedAbsences(new Set())
    } finally {
      setFixing(false)
    }
  }

  const handleFixAllConfirm = async () => {
    setFixing(true)
    try {
      // Empty array signals fix all
      await onFixAbsences([])
      setShowFixAllModal(false)
      setSelectedAbsences(new Set())
    } finally {
      setFixing(false)
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // HH:MM
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Absences - {user.first_name} {user.last_name}
          </h2>
          <p className="text-gray-600">
            {pagination.total} absence(s) détectée(s)
          </p>
        </div>

        {absences.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Aucune absence détectée</p>
          </div>
        ) : (
          <>
            {/* Action Buttons */}
            <div className="mb-4 flex gap-3 flex-wrap">
              <button
                onClick={toggleAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={fixing}
              >
                {selectedAbsences.size === absences.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              
              <button
                onClick={handleFixSelected}
                disabled={selectedAbsences.size === 0 || fixing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Corriger la sélection ({selectedAbsences.size})
              </button>

              <button
                onClick={() => setShowFixAllModal(true)}
                disabled={fixing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Corriger toutes les absences ({pagination.total})
              </button>
            </div>

            {/* Absence List */}
            <div className="space-y-3 mb-6">
              {absences.map((absence) => (
                <div
                  key={absence.date}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedAbsences.has(absence.date)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAbsence(absence.date)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedAbsences.has(absence.date)}
                          onChange={() => toggleAbsence(absence.date)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {new Date(absence.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {absence.reason === 'incomplete_clock' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pointage incomplet
                          </span>
                        )}
                      </div>

                      {/* Expected Schedule */}
                      <div className="ml-8 flex flex-wrap gap-2">
                        {absence.expectedSchedule.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fix All Confirmation Modal */}
      <FixAllAbsencesModal
        isOpen={showFixAllModal}
        onClose={() => setShowFixAllModal(false)}
        onConfirm={handleFixAllConfirm}
        totalAbsences={pagination.total}
        loading={fixing}
      />
    </>
  )
}