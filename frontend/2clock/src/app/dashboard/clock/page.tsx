"use client"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Bars3Icon } from "@heroicons/react/24/outline"
import EmployeeSidebar from "@/app/components/EmployeeSidebar"

type Punch = {
  id: string
  type: "Arrivée" | "Départ"
  time: string
}

function formatTime(d = new Date()) {
  return d.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("clock_history")
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("clock_history", JSON.stringify(history))
  }, [history])

  const addPunch = async (type: Punch["type"]) => {
    const p: Punch = { id: String(Date.now()), type, time: nowIso() }
    setHistory((s) => [p, ...s])
    try {
      await fetch("/api/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, time: p.time, pin }),
      })
    } catch {}
  }

  const handleSubmit = async () => {
    setMessage(null)
    if (pin.length < 1) {
      setMessage("Entrez votre code PIN")
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    const last = history[0]
    const nextType: Punch["type"] =
      last && last.type === "Arrivée" ? "Départ" : "Arrivée"
    await addPunch(nextType)
    setMessage(`${nextType} enregistrée`)
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
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col w-full">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20 w-full shadow-sm">
          <button 
            onClick={() => setMobileOpen(true)} 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Ouvrir le menu"
          >
            <Bars3Icon
              className="w-6 h-6"
              style={{ color: "var(--color-secondary)" }}
            />
          </button>
          <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
          <div className="w-10" />
        </header>

        {/* Main content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start w-full">
            
            {/* Section pointage */}
            <section className="lg:col-span-2 w-full">
              {/* Horloge */}
              <div className={`text-center mb-4 sm:mb-6 md:mb-8 transform transition-all duration-700 ${
                mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
              }`}>
                <div className="inline-block bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums tracking-tight">
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2 font-medium px-2">
                  {formatTime(currentTime)}
                </p>
              </div>

              {/* Card de pointage */}
              <div className={`max-w-md mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 transform transition-all duration-700 border border-gray-100 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`} style={{ transitionDelay: '100ms' }}>
                
                {/* Header */}
                <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-all duration-300 hover:scale-110 hover:rotate-12">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="sm:w-8 sm:h-8"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#EC4D36"
                        strokeWidth="2"
                      />
                      <path
                        d="M12 7v5l3 2"
                        stroke="#EC4D36"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Pointer</h3>
                  <p className="text-xs sm:text-sm text-gray-500 text-center px-2">Entrez votre code PIN à 6 chiffres</p>
                </div>

                {/* PIN display */}
                <div className="mb-4 sm:mb-6">
                  <div className="h-12 sm:h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center tracking-widest border-2 border-gray-200 transition-all duration-300 hover:border-[var(--color-primary)]">
                    <div className="flex gap-2 sm:gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
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
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => press(String(n))}
                      className="h-14 sm:h-16 md:h-18 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold hover:from-[rgba(236,77,54,0.08)] hover:to-[rgba(236,77,54,0.04)] transition-all duration-200 active:scale-95 border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md group"
                    >
                      <span className="group-hover:scale-110 transition-transform duration-200">{n}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => press("clear")}
                    className="h-14 sm:h-16 md:h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl text-xs sm:text-sm font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 active:scale-95 border border-gray-300 hover:shadow-md"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => press("0")}
                    className="h-14 sm:h-16 md:h-18 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold hover:from-[rgba(236,77,54,0.08)] hover:to-[rgba(236,77,54,0.04)] transition-all duration-200 active:scale-95 border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md group"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-200">0</span>
                  </button>
                  <button
                    onClick={() => press("back")}
                    className="h-14 sm:h-16 md:h-18 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl text-lg sm:text-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 active:scale-95 border border-gray-300 hover:shadow-md"
                  >
                    ←
                  </button>
                </div>

                {/* Submit button */}
                <div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all duration-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {loading ? "Enregistrement..." : `Pointer ${getLastPunchType()}`}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div className={`mt-4 text-center text-xs sm:text-sm font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-xl ${
                    message.includes('Arrivée') || message.includes('Départ')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                  } animate-fadeIn`}>
                    {message}
                  </div>
                )}
              </div>
            </section>

            {/* Historique */}
            <aside className={`lg:col-span-1 w-full transform transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 lg:sticky lg:top-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4 className="font-bold text-base sm:text-lg">Historique</h4>
                </div>
                
                <div className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 font-medium bg-gray-50 p-2 sm:p-3 rounded-lg">
                  📅 {formatTime()}
                </div>
                
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                  {history.length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-8 sm:h-8">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">Aucun pointage aujourd'hui</p>
                    </div>
                  )}
                  {history.map((h, idx) => (
                    <div 
                      key={h.id} 
                      className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 transform ${
                        mounted ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                      }`}
                      style={{ transitionDelay: `${300 + idx * 50}ms` }}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm sm:text-base ${
                        h.type === "Arrivée" 
                          ? "bg-gradient-to-br from-green-400 to-green-600" 
                          : "bg-gradient-to-br from-orange-400 to-orange-600"
                      }`}>
                        {h.type === "Arrivée" ? "→" : "←"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm">{h.type}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
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
      </div>
    </div>
  )
}
