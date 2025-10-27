"use client"
import React, { useEffect, useState } from "react"
import { useTeam } from "@/contexts/TeamContext"
import { BuildingOffice2Icon, ClockIcon } from "@heroicons/react/24/outline"

type Punch = {
  id: string
  type: "Arrivée" | "Départ"
  time: string
}

function formatTime(d = new Date()) {
  return d.toLocaleString('fr-FR', {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit"
  })
}

function nowIso() {
  return new Date().toISOString()
}

export default function ClockPage() {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<Punch[]>([])
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { currentTeam, user } = useTeam()

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clock_history")
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("clock_history", JSON.stringify(history))
  }, [history])

  //TODO : Délocaliser cette fonction (avec les autres fonctions de clock)
  // et faire une requête à la route clocks/clockInOut
  //TODO : Récupérer les infos de retard/avance renvoyées par clockInOut
  const addPunch = async (type: Punch["type"]) => {
    const p: Punch = { id: String(Date.now()), type, time: nowIso() }
    setHistory((s) => [p, ...s])
    
    try {
      const token = localStorage.getItem('session')
      if (token && currentTeam) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}/clocks`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            user_id: user?.id,
            clock_in: type === "Arrivée" ? p.time : null,
            clock_out: type === "Départ" ? p.time : null
          }),
        })
      }
    } catch (error) {
      console.error('Error submitting punch:', error)
    }
  }

  const handleSubmit = async () => {
    setMessage(null)
    if (pin.length < 4) {
      setMessage("Entrez votre code PIN (minimum 4 chiffres)")
      return
    }
    
    if (!currentTeam) {
      setMessage("Aucune équipe sélectionnée")
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    const last = history[0]
    const nextType: Punch["type"] =
      last && last.type === "Arrivée" ? "Départ" : "Arrivée"
    
    await addPunch(nextType)
    setMessage(`${nextType} enregistrée avec succès`)
    setLoading(false)
    setPin("")
  }

  const press = (d: string) => {
    if (loading) return
    if (d === "clear") return setPin("")
    if (d === "back") return setPin((p) => p.slice(0, -1))
    setPin((p) => (p.length >= 6 ? p : p + d))
  }

  const getLastPunchType = () => {
    const last = history[0]
    return last && last.type === "Arrivée" ? "Départ" : "Arrivée"
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
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {formatTime(currentTime)}
            </p>
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
                {user ? `Bonjour ${user.first_name}` : 'Entrez votre code PIN à 6 chiffres'}
              </p>
            </div>

            {/* PIN display */}
            <div className="mb-6">
              <div className="h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center tracking-widest border-2 border-gray-200 transition-all duration-300 hover:border-[var(--color-primary)]">
                <div className="flex gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < pin.length 
                          ? "bg-[var(--color-primary)] scale-110 shadow-lg" 
                          : "bg-gray-300"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
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
                disabled={loading || !currentTeam}
                className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {loading ? "Enregistrement..." : `Pointer ${getLastPunchType()}`}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-4 text-center text-sm font-medium py-3 px-4 rounded-xl ${
                message.includes('succès') || message.includes('Arrivée') || message.includes('Départ')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
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
              📅 {formatTime()}
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Aucun pointage aujourd'hui</p>
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
                      ? "bg-gradient-to-br from-green-400 to-green-600" 
                      : "bg-gradient-to-br from-orange-400 to-orange-600"
                  }`}>
                    {h.type === "Arrivée" ? "→" : "←"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{h.type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      🕐 {new Date(h.time).toLocaleString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
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