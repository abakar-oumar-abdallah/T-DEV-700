"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {HomeIcon,ClockIcon,UserIcon,Bars3Icon,ArrowRightOnRectangleIcon} from '@heroicons/react/24/outline'

type Punch = {
  id: string
  type: 'Arrivée' | 'Départ'
  time: string
}

function formatTime(d = new Date()) {
  return d.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function nowIso() {
  return new Date().toISOString()
}

export default function ClockPage() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<Punch[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname() || ''
  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [mobileOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('clock_history')
        if (raw) setHistory(JSON.parse(raw))
      } catch (e) {
        // Ignore error
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clock_history', JSON.stringify(history))
    }
  }, [history])

  const addPunch = async (type: Punch['type']) => {
    const p: Punch = { id: String(Date.now()), type, time: nowIso() }
    setHistory((s) => [p, ...s])
    try {
      await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, time: p.time, pin }),
      })
    } catch (e) {
      // Ignore error
    }
  }

  const handleSubmit = async () => {
    setMessage(null)
    if (pin.length < 1) {
      setMessage('Entrez votre code PIN')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    
    const last = history[0]
    const nextType: Punch['type'] = last && last.type === 'Arrivée' ? 'Départ' : 'Arrivée'
    await addPunch(nextType)
    setMessage(`${nextType} enregistrée`)
    setLoading(false)
    setPin('')
  }

  const press = (d: string) => {
    if (loading) return
    if (d === 'clear') return setPin('')
    if (d === 'back') return setPin((p) => p.slice(0, -1))
    setPin((p) => (p.length >= 6 ? p : p + d))
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <aside
        className="flex flex-col w-56 max-w-[78%] sm:w-64 sm:max-w-none h-screen p-6 overflow-y-auto"
        style={{ background: 'var(--color-secondary)', color: 'white' }}
      >
        <div className="mb-6">
          <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} />
        </div>
        <div className="rounded-md p-4 mb-6 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="font-semibold">Employé(e)</div>
          <div className="text-sm text-white/70">Bienvenue</div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-3">
            <li>
              <Link href="/dashboard/employee" className={`${isActive('/dashboard/employee') ? 'rounded-md py-3 px-4 flex items-center gap-3 bg-[var(--color-primary)] text-[var(--color-secondary)]' : 'text-white/80 hover:text-white py-3 px-2 flex items-center gap-3'}`}>
                <HomeIcon className="w-5 h-5" />
                <span className="font-medium">Accueil</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/clock" className={`${isActive('/dashboard/clock') ? 'rounded-md py-3 px-4 flex items-center gap-3 bg-[var(--color-primary)] text-[var(--color-secondary)]' : 'text-white/80 hover:text-white py-3 px-2 flex items-center gap-3'}`}>
                <ClockIcon className="w-6 h-6" style={{ color: isActive('/dashboard/clock') ? 'var(--color-secondary)' : 'var(--color-primary)' }} />
                <span>Pointage</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/employee" className={`${isActive('/dashboard/employee') ? 'text-white/80 py-3 px-2 flex items-center gap-3' : 'text-white/80 hover:text-white py-3 px-2 flex items-center gap-3'}`}>
                <UserIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <span>Profil</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-6">
          <button className="flex items-center gap-3 text-white/80 hover:text-white">
            <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20 w-full shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md">
            <Bars3Icon className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
          </button>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start py-8">
          <section className="lg:col-span-2">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold">{new Date().toLocaleTimeString()}</h2>
            </div>

            <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-[rgba(236,77,54,0.06)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#EC4D36" strokeWidth="1.5"/><path d="M12 7v5l3 2" stroke="#EC4D36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="text-xl font-semibold">Pointer</h3>
                <p className="text-sm text-gray-500">Entrez votre code PIN</p>
              </div>

              <div className="mb-4">
                <div className="h-10 bg-gray-100 rounded-md flex items-center justify-center tracking-widest">
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-400"></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[1,2,3,4,5,6,7,8,9].map((n) => (
                  <button key={n} onClick={() => press(String(n))} className="h-16 bg-gray-100 rounded-md flex items-center justify-center text-lg font-medium hover:bg-gray-200">{n}</button>
                ))}
                <button onClick={() => press('clear')} className="h-16 bg-gray-200 rounded-md">Clear</button>
                <button onClick={() => press('0')} className="h-16 bg-gray-100 rounded-md flex items-center justify-center text-lg font-medium">0</button>
                <button onClick={() => press('back')} className="h-16 bg-gray-200 rounded-md">←</button>
              </div>

              <div>
                <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-hover transition">
                  {loading ? 'Enregistrement...' : 'Pointer'}
                </button>
              </div>

              {message && <div className="mt-4 text-center text-sm text-gray-700">{message}</div>}
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6">
              <h4 className="font-semibold mb-4">Historique des pointages</h4>
              <div className="text-sm text-gray-500 mb-3">{formatTime()}</div>
              <div className="space-y-4">
                {history.length === 0 && <div className="text-sm text-gray-400">Aucun pointage</div>}
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">•</div>
                    <div className="flex-1">
                      <div className="font-medium">{h.type}</div>
                      <div className="text-sm text-gray-500">{new Date(h.time).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}