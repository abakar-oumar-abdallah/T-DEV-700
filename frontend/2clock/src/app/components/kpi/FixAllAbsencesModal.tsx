import React from 'react'
import Modal from '../Modal'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface FixAllAbsencesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  totalAbsences: number
  loading: boolean
}

export default function FixAllAbsencesModal({
  isOpen,
  onClose,
  onConfirm,
  totalAbsences,
  loading
}: FixAllAbsencesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Corriger toutes les absences"
      mode="update"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Warning message */}
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900 mb-1">
              Attention : Action importante
            </p>
            <p className="text-sm text-yellow-800">
              Vous êtes sur le point de créer automatiquement des pointages pour{' '}
              <strong>{totalAbsences} absence(s)</strong> détectée(s).
            </p>
          </div>
        </div>

        {/* Information */}
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Cette action va :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
            <li>Créer des entrées de pointage (arrivée et départ) pour chaque absence</li>
            <li>Utiliser les horaires prévus dans le planning de chaque employé</li>
            <li>Corriger toutes les absences sur toute la période consultée</li>
          </ul>
        </div>

        {/* Confirmation text */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Êtes-vous sûr de vouloir continuer ?
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Correction en cours...' : 'Confirmer la correction'}
          </button>
        </div>
      </div>
    </Modal>
  )
}