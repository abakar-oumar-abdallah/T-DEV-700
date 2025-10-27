"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useTeam } from '@/contexts/TeamContext'
import { generateTotp, resetTeamSecret } from '@/totp/totp'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'

interface TotpData {
  teamId: string;
  code: string;
  expiresIn: number;
  timestamp: string;
}

export default function TotpManagerPage() {
  const { currentTeam, user } = useTeam()
  const router = useRouter()
  const [totpData, setTotpData] = useState<TotpData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Vérifier si l'utilisateur est manager
  const isManager = currentTeam?.role === 'manager'

  // Rediriger si pas manager
  useEffect(() => {
    if (currentTeam && !isManager) {
      router.push('/dashboard/employee')
    }
  }, [currentTeam, isManager, router])

  // Initialiser la connexion WebSocket
  useEffect(() => {
    if (!currentTeam?.team.id || !isManager) return

    const newSocket = io(process.env.NEXT_PUBLIC_BACKENDURL || 'http://localhost:3001', {
      transports: ['websocket'],
      forceNew: true,
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connecté')
      newSocket.emit('join-team', currentTeam.team.id)
      
      // Demander un code dès que le socket est connecté
      if (!isActive && !loading) {
        handleGenerateTotp()
      }
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket déconnecté')
    })

    // Écouter les mises à jour TOTP pour cette équipe
    newSocket.on(`totp:${currentTeam.team.id}`, (data: TotpData) => {
      console.log('Nouveau code TOTP reçu:', data)
      setTotpData(data)
      setTimeRemaining(data.expiresIn)
      setIsActive(true)
      setError(null)
      setLoading(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Erreur connexion WebSocket:', error)
      setError('Connexion temps réel indisponible')
      setLoading(false)
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.emit('leave-team', currentTeam.team.id)
        newSocket.disconnect()
      }
    }
  }, [currentTeam?.team.id, isManager])

  // Timer de décompte
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Demander automatiquement un nouveau code quand celui-ci expire
          if (socket?.connected && currentTeam?.team.id) {
            handleGenerateTotp()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeRemaining, socket?.connected, currentTeam?.team.id])

  // Générer un code automatiquement quand la page se charge
  useEffect(() => {
    if (currentTeam?.team.id && isManager && socket?.connected && !isActive && !loading) {
      handleGenerateTotp()
    }
  }, [currentTeam?.team.id, isManager, socket?.connected, isActive, loading])

  const handleGenerateTotp = useCallback(async () => {
    if (!currentTeam?.team.id || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await generateTotp(currentTeam.team.id.toString())
      
      if (!result.success) {
        setError(result.error || 'Échec génération du code')
        setLoading(false)
      }
      // Succès géré par WebSocket
    } catch (error) {
      console.error('Erreur génération TOTP:', error)
      setError('Échec génération du code')
      setLoading(false)
    }
  }, [currentTeam?.team.id, loading])

  const handleResetSecret = useCallback(async () => {
    if (!currentTeam?.team.id || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await resetTeamSecret(currentTeam.team.id.toString())
      
      if (result.success) {
        setTotpData(null)
        setIsActive(false)
        setTimeRemaining(0)
        setLoading(false)
        // setTimeout(() => {
        //   alert('Secret réinitialisé avec succès.')
        // }, 100)
      } else {
        setError(result.error || 'Échec réinitialisation')
        setLoading(false)
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error)
      setError('Échec réinitialisation')
      setLoading(false)
    }
  }, [currentTeam?.team.id, loading])

  // Rafraîchissement manuel
  const handleManualRefresh = useCallback(() => {
    if (!loading) {
      // Reset l'état actuel et génère un nouveau code
      setIsActive(false)
      setTotpData(null)
      setTimeRemaining(0)
      handleGenerateTotp()
    }
  }, [loading, handleGenerateTotp])

  // Accès refusé si pas manager
  if (!currentTeam || !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès Restreint</h1>
            <p className="text-gray-600">Seuls les responsables d'équipe peuvent accéder aux codes TOTP.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[rgba(255,51,30,0.1)]">
              <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Code de Validation</h1>
            <p className="text-gray-600">Affichez ce code pour que les collaborateurs de l'équipe puissent pointer.</p>
            
            {/* Team Info */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">Équipe: {currentTeam.team.name}</span>
              {socket?.connected && (
                <span className="text-xs text-green-600">● En direct</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium text-center">{error}</p>
              </div>
            </div>
          )}

          {/* Code Display */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8">
            <div className="text-center">
              {isActive && totpData ? (
                <>
                  <div className="text-sm text-gray-600 mb-3 font-medium">CODE DE VALIDATION</div>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {totpData.code.split("").map((digit, i) => (
                      <div
                        key={i}
                        className="w-14 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-4xl font-bold text-[var(--color-primary)]"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                        timeRemaining > 15 ? 'bg-green-500' : 
                        timeRemaining > 5 ? 'bg-yellow-500' : 'bg-[var(--color-primary)]'
                      }`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <span>Nouveau code dans {timeRemaining}s</span>
                  </div>
                </>
              ) : (
                <div className="py-8">
                  <div className="text-sm text-gray-600 mb-3 font-medium">CODE DE VALIDATION</div>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-14 h-20 bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-4xl font-bold text-gray-400"
                      >
                        {loading ? '•' : '—'}
                      </div>
                    ))}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {loading ? 'Génération en cours...' : 'Aucun code actif'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {/* <button
              onClick={handleManualRefresh}
              disabled={loading || !socket?.connected}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Génération...' : !socket?.connected ? 'Connexion...' : 'Générer Nouveau Code'}
            </button> */}

            <button
              onClick={handleResetSecret}
              disabled={loading || !socket?.connected}
              className="bg-[var(--color-primary)] hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}