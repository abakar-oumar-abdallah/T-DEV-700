"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { useTeam } from "@/contexts/TeamContext"
import { clockInOut, getClockHistory } from "@/clock/clock"
import { GetUserTeamPlanning } from "@/planning/planning"
import { BuildingOffice2Icon, ClockIcon } from "@heroicons/react/24/outline"

type Punch = {
  id: string
  type: "Arrivée" | "Départ"
  time: string
  isLate?: boolean
  warnings?: string[]
  lateBy?: number
  earlyBy?: number
  overtimeBy?: number
}

// Fonction pour filtrer les warnings anglais
const filterEnglishWarnings = (warnings?: string[]): string[] => {
  if (!warnings) return [];
  
  return warnings.filter(warning => {
    const englishKeywords = [
      'late by', 'early by', 'leaving', 'working', 'minutes', 'scheduled',
      'overtime', 'until', 'start', 'end', 'anomaly detected'
    ];
    
    const warningLower = warning.toLowerCase();
    const hasEnglishKeywords = englishKeywords.some(keyword => 
      warningLower.includes(keyword.toLowerCase())
    );
    
    // Garder seulement les warnings qui ne contiennent pas de mots clés anglais
    return !hasEnglishKeywords;
  });
};

// Fonction pour calculer les statistiques de temps
const calculateTimeStats = async (punch: Punch, currentTeam: any): Promise<Punch> => {
  if (!currentTeam || !punch.time) return punch;

  try {
    // Obtenir les horaires programmés pour ce jour
    const punchDate = new Date(punch.time);
    const dayOfWeek = punchDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Simuler les horaires standards (à remplacer par un appel API si nécessaire)
    const standardSchedules: { [key: string]: { start: string, end: string } } = {
      'monday': { start: '09:00', end: '17:00' },
      'tuesday': { start: '09:00', end: '17:00' },
      'wednesday': { start: '09:00', end: '17:00' },
      'thursday': { start: '09:00', end: '17:00' },
      'friday': { start: '09:00', end: '17:00' }
    };

    const schedule = standardSchedules[dayOfWeek];
    if (!schedule) return punch;

    const punchTime = punchDate.toTimeString().substring(0, 5); // HH:MM format
    const [punchHour, punchMinute] = punchTime.split(':').map(Number);
    const punchMinutes = punchHour * 60 + punchMinute;

    if (punch.type === "Arrivée") {
      // Calculer le retard/avance pour l'arrivée
      const [startHour, startMinute] = schedule.start.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      
      if (punchMinutes > startMinutes) {
        // En retard
        punch.lateBy = punchMinutes - startMinutes;
        punch.isLate = true;
      } else if (punchMinutes < startMinutes) {
        // En avance
        punch.earlyBy = startMinutes - punchMinutes;
        punch.isLate = false;
      }
    } else if (punch.type === "Départ") {
      // Calculer les heures supplémentaires/départ anticipé
      const [endHour, endMinute] = schedule.end.split(':').map(Number);
      const endMinutes = endHour * 60 + endMinute;
      
      if (punchMinutes > endMinutes) {
        // Heures supplémentaires
        punch.overtimeBy = punchMinutes - endMinutes;
      } else if (punchMinutes < endMinutes) {
        // Départ anticipé
        punch.earlyBy = endMinutes - punchMinutes;
      }
    }

    return punch;
  } catch (error) {
    console.error('Error calculating time stats:', error);
    return punch;
  }
};

function formatTime(d = new Date(), timezone = 'Europe/Paris') {
  return d.toLocaleString('fr-FR', {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone
  })
}

export default function ClockPage() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<Punch[]>([])
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todaySchedule, setTodaySchedule] = useState<{time_in: string, time_out: string} | null>(null)
  const { currentTeam, user } = useTeam()

  const teamTimezone = currentTeam?.team.timezone || 'Europe/Paris'

  // Rediriger les superadmin vers leur page
  useEffect(() => {
    if (user?.permission === 'superadmin') {
      router.push('/dashboard/superadmin')
    }
  }, [user, router])

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Gestion du clavier PC
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (loading) return
      
      // Chiffres 0-9
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        press(e.key)
      }
      // Backspace
      else if (e.key === 'Backspace') {
        e.preventDefault()
        press('back')
      }
      // Escape ou Delete pour Clear
      else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault()
        press('clear')
      }
      // Enter pour valider
      else if (e.key === 'Enter' && pin.length === 6 && currentTeam) {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [loading, pin, currentTeam])

  // Load clock history from API on component mount
  useEffect(() => {
    const loadClockHistory = async () => {
      if (currentTeam?.team.id && user?.id) {
        const today = new Date().toISOString().split('T')[0]
        const result = await getClockHistory(currentTeam.team.id.toString(), today)
        
        if (result.success && result.data) {
          // Convert API data to local Punch format with calculated stats
          const punches: Punch[] = []
          
          const dataArray = Array.isArray(result.data) ? result.data : [result.data]
          
          for (const clockEntry of dataArray) {
            if (clockEntry.arrival_time) {
              let arrivalPunch: Punch = {
                id: `${clockEntry.id}-arrival`,
                type: "Arrivée",
                time: clockEntry.arrival_time
              }
              // Calculer les statistiques pour l'arrivée
              arrivalPunch = await calculateTimeStats(arrivalPunch, currentTeam);
              punches.push(arrivalPunch);
            }
            if (clockEntry.departure_time) {
              let departurePunch: Punch = {
                id: `${clockEntry.id}-departure`,
                type: "Départ",
                time: clockEntry.departure_time
              }
              // Calculer les statistiques pour le départ
              departurePunch = await calculateTimeStats(departurePunch, currentTeam);
              punches.push(departurePunch);
            }
          }
          
          // Sort by time, most recent first
          punches.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          setHistory(punches)
        }
      }
    }

    loadClockHistory()
  }, [currentTeam?.team.id, user?.id])

  // Load today's schedule
  useEffect(() => {
    const loadTodaySchedule = async () => {
      if (!currentTeam?.id || !currentTeam?.team.id) return;
      
      try {
        const result = await GetUserTeamPlanning(parseInt(currentTeam.id), currentTeam.team.id);
        if (result.success && result.data?.planning?.schedule) {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const schedule = result.data.planning.schedule.find((s: any) => s.day === today);
          if (schedule) {
            setTodaySchedule({
              time_in: schedule.time_in.substring(0, 5),
              time_out: schedule.time_out.substring(0, 5)
            });
          }
        }
      } catch (error) {
        console.error('Error loading today schedule:', error);
      }
    };

    loadTodaySchedule();
  }, [currentTeam?.id, currentTeam?.team.id]);

  const handleSubmit = async () => {
    setMessage(null)
    
    if (pin.length !== 6) {
      setMessage("Le code TOTP doit contenir exactement 6 chiffres")
      return
    }
    
    if (!currentTeam) {
      setMessage("Aucune équipe sélectionnée")
      return
    }

    if (!user) {
      setMessage("Utilisateur non authentifié")
      return
    }

    const teamId = currentTeam.id
    if (!teamId) {
      setMessage("Equipe non trouvée")
      return
    }

    setLoading(true)

    try {
      const result = await clockInOut(currentTeam.team.id.toString(), {
        teamId: teamId,
        code: pin
      })

      if (result.success && result.data && !Array.isArray(result.data)) {
        const actionType: Punch["type"] = result.data.status === 'clocked_in' ? "Arrivée" : "Départ"
        const time = result.data.status === 'clocked_in' 
          ? result.data.arrival_time 
          : result.data.departure_time

        if (time) {
          let newPunch: Punch = {
            id: `${result.data.id}-${actionType.toLowerCase()}`,
            type: actionType,
            time: time,
            isLate: result.isLate,
            warnings: filterEnglishWarnings(result.warnings), // Filtrer les warnings anglais
            lateBy: result.lateBy,
            earlyBy: result.earlyBy,
            overtimeBy: result.overtimeBy
          }
          
          // Calculer les statistiques si elles ne sont pas déjà présentes
          if (!newPunch.lateBy && !newPunch.earlyBy && !newPunch.overtimeBy) {
            newPunch = await calculateTimeStats(newPunch, currentTeam);
          }
          
          setHistory(prev => [newPunch, ...prev])
        }

        // Messages de succès simplifiés et entièrement en français
        let successMessage = `${actionType} enregistrée avec succès`
        
        if (result.isLate && result.lateBy && result.lateBy > 0) {
          successMessage += ` - Retard de ${result.lateBy} minute${result.lateBy > 1 ? 's' : ''}`
        } else if (result.earlyBy && result.earlyBy > 0) {
          successMessage += ` - En avance de ${result.earlyBy} minute${result.earlyBy > 1 ? 's' : ''}`
        } else if (result.overtimeBy && result.overtimeBy > 0) {
          successMessage += ` - Heures supplémentaires: ${result.overtimeBy} minute${result.overtimeBy > 1 ? 's' : ''}`
        }

        // N'afficher que les warnings français (filtrés)
        const frenchWarnings = filterEnglishWarnings(result.warnings);
        if (frenchWarnings.length > 0) {
          successMessage += ` (${frenchWarnings.join(', ')})`
        }
        
        setMessage(successMessage)
        setPin("")
      } else {
        // Error management with french messages
        switch (result.errorCode) {
          case 'ERR_MULTIPLE_CLOCK_SAME_DAY':
            setMessage('Vous avez déjà pointé aujourd\'hui. Un seul pointage d\'arrivée par jour est autorisé.')
            break
          case 'ERR_NO_SCHEDULE_FOR_DAY':
            setMessage('Aucun horaire programmé pour ce jour. Vous ne pouvez pas pointer.')
            break
          case 'ERR_NO_PLANNING_FOUND':
            setMessage('Aucun planning trouvé pour votre équipe.')
            break
          case 'ERR_INCORRECT_TOTP':
            setMessage('Code de validation incorrect ou expiré. Vérifiez le code affiché.')
            break
          case 'ERR_TOTP_REQUIRED':
            setMessage('Code de validation requis.')
            break
          default:
            // Utiliser le message nettoyé (déjà traduit par clock.tsx)
            setMessage(`${result.message}`)
        }
      }
    } catch (error) {
      console.error('Clock in/out error:', error)
      setMessage('Erreur de connexion. Vérifiez votre réseau et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const press = (d: string) => {
    if (loading) return
    if (d === "clear") return setPin("")
    if (d === "back") return setPin((p) => p.slice(0, -1))
    setPin((p) => (p.length >= 6 ? p : p + d))
  }

  const getNextActionType = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayPunches = history.filter(h => h.time.startsWith(today))
    const lastPunch = todayPunches[0]
    return lastPunch && lastPunch.type === "Arrivée" ? "Départ" : "Arrivée"
  }

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <section className="lg:col-span-2">
          {/* Horloge */}
          <div className={`text-center mb-8 transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}>
            <div className="inline-block bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
              <h2 className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  timeZone: teamTimezone
                })}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {formatTime(currentTime, teamTimezone)}
            </p>
            {currentTeam && (
              <p className="text-xs text-gray-400 mt-1">
                Fuseau horaire: {teamTimezone}
              </p>
            )}
            
            {/* Horaires du jour */}
            {todaySchedule && (
              <div className="mt-4 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-800 font-medium">
                  Horaires du jour : {todaySchedule.time_in} - {todaySchedule.time_out}
                </p>
              </div>
            )}
          </div>

          {/* Card de pointage */}
          <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-700 border border-gray-100 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '100ms' }}>
            
            {/* Header */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-all duration-300 hover:scale-110 hover:rotate-12">
                <ClockIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Pointer</h3>
              <p className="text-sm text-gray-500 text-center">
                {user ? `Bonjour ${user.first_name}` : 'Entrez votre code TOTP à 6 chiffres'}
                {currentTeam && (
                  <span className="block text-xs mt-1">
                    Équipe: <span className="font-medium">{currentTeam.team.name}</span>
                  </span>
                )}
              </p>
            </div>

            {/* PIN display */}
            <div className="mb-6">
              <div className="h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center tracking-widest border-2 border-gray-200 transition-all duration-300 hover:border-[var(--color-primary)]">
                <div className="flex gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                        i < pin.length 
                          ? "bg-[var(--color-primary)] text-white scale-105 shadow-lg" 
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {i < pin.length ? pin[i] : '·'}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Utilisez le pavé numérique ou votre clavier • Entrée pour valider
              </p>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => press(String(n))}
                  disabled={loading}
                  className="h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-xl font-bold hover:from-[rgba(236,77,54,0.08)] hover:to-[rgba(236,77,54,0.04)] transition-all duration-200 active:scale-95 border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md group disabled:opacity-50"
                >
                  <span className="group-hover:scale-110 transition-transform duration-200">{n}</span>
                </button>
              ))}
              <button
                onClick={() => press("clear")}
                disabled={loading}
                className="h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl text-sm font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 active:scale-95 border border-gray-300 hover:shadow-md disabled:opacity-50"
              >
                Clear
              </button>
              <button
                onClick={() => press("0")}
                disabled={loading}
                className="h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-xl font-bold hover:from-[rgba(236,77,54,0.08)] hover:to-[rgba(236,77,54,0.04)] transition-all duration-200 active:scale-95 border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md group disabled:opacity-50"
              >
                <span className="group-hover:scale-110 transition-transform duration-200">0</span>
              </button>
              <button
                onClick={() => press("back")}
                disabled={loading}
                className="h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl text-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 active:scale-95 border border-gray-300 hover:shadow-md disabled:opacity-50"
              >
                ←
              </button>
            </div>

            {/* Submit button */}
            <div>
              <button
                onClick={handleSubmit}
                disabled={loading || !currentTeam || pin.length !== 6}
                className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {loading ? "Enregistrement..." : `Pointer ${getNextActionType()}`}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-4 text-center text-sm font-medium py-3 px-4 rounded-xl ${
                message.includes('succès') || message.includes('Arrivée') || message.includes('Départ')
                  ? message.includes('Retard') || message.includes('Attention')
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              } animate-fadeIn`}>
                {message}
              </div>
            )}

            {!currentTeam && (
              <div className="mt-4 text-center">
                <p className="text-sm text-orange-600">
                  Veuillez <a href="/teams" className="underline font-medium hover:text-orange-700">sélectionner une équipe</a> pour pointer
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Historique */}
        <aside className={`lg:col-span-1 transform transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`} style={{ transitionDelay: '200ms' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="font-bold text-lg">Historique des pointages</h4>
            </div>
            
            <div className="text-sm text-gray-500 mb-4 font-medium bg-gray-50 p-3 rounded-lg">
              {formatTime()}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{"Aucun pointage aujourd'hui"}</p>
                </div>
              )}
              {history.slice(0, 10).map((h, idx) => (
                <div 
                  key={h.id} 
                  className={`flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 transform ${
                    mounted ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${300 + idx * 50}ms` }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                    h.type === "Arrivée" 
                      ? h.isLate
                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                        : "bg-gradient-to-br from-green-400 to-green-600"
                      : "bg-gradient-to-br from-blue-400 to-blue-600"
                  }`}>
                    {h.type === "Arrivée" ? "→" : "←"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                      {h.type}
                      {h.isLate && h.lateBy && h.lateBy > 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          +{h.lateBy} min
                        </span>
                      )}
                      {h.earlyBy && h.earlyBy > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          -{h.earlyBy} min
                        </span>
                      )}
                      {h.overtimeBy && h.overtimeBy > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          +{h.overtimeBy} min sup.
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(h.time).toLocaleString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                    {h.warnings && h.warnings.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {h.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}