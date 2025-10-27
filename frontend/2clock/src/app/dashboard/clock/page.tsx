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
  const [currentTime, setCurrentTime] = useState(new Date())
  const { currentTeam, user } = useTeam()

  useEffect(() => {
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

  return (
    <main className="p-6 sm:p-10 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <section className="lg:col-span-2">
          {/* {currentTeam && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{currentTeam.team.name}</h3>
                  <p className="text-sm text-gray-500">{currentTeam.role === 'manager' ? 'Responsable' : 'Employé'}</p>
                </div>
              </div>
            </div>
          )} */}

          <div className="text-center mb-6">
            <h2 className="text-4xl font-semibold text-gray-800 mb-2">
              {currentTime.toLocaleTimeString('fr-FR')}
            </h2>
            <p className="text-gray-600">{formatTime(currentTime)}</p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-[rgba(236,77,54,0.06)]">
                <ClockIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="text-xl font-semibold">Pointer</h3>
              <p className="text-sm text-gray-500">
                {user ? `Bonjour ${user.first_name}` : 'Entrez votre code PIN'}
              </p>
            </div>

            <div className="mb-4">
              <div className="h-10 bg-gray-100 rounded-md flex items-center justify-center tracking-widest">
                <div className="flex gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < pin.length ? "bg-gray-700" : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => press(String(n))}
                  disabled={loading}
                  className="h-16 bg-gray-100 rounded-md flex items-center justify-center text-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => press("clear")}
                disabled={loading}
                className="h-16 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                Effacer
              </button>
              <button
                onClick={() => press("0")}
                disabled={loading}
                className="h-16 bg-gray-100 rounded-md flex items-center justify-center text-lg font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={() => press("back")}
                disabled={loading}
                className="h-16 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                ←
              </button>
            </div>

            <div>
              <button
                onClick={handleSubmit}
                disabled={loading || !currentTeam}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-md hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Pointer"}
              </button>
            </div>

            {message && (
              <div className={`mt-4 text-center text-sm ${
                message.includes('succès') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}

            {!currentTeam && (
              <div className="mt-4 text-center">
                <p className="text-sm text-orange-600">
                  Veuillez <a href="/teams" className="underline">sélectionner une équipe</a> pour pointer
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="font-semibold mb-4">Historique des pointages</h4>
            <div className="text-sm text-gray-500 mb-3">{formatTime()}</div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.length === 0 && (
                <div className="text-sm text-gray-400">{"Aucun pointage aujourd'hui"}</div>
              )}
              {history.slice(0, 10).map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    h.type === 'Arrivée' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {h.type === 'Arrivée' ? '→' : '←'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{h.type}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(h.time).toLocaleString('fr-FR')}
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