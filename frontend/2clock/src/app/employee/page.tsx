"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {HomeIcon,ClockIcon,UserIcon,ChartBarIcon,Bars3Icon,ArrowRightOnRectangleIcon,} from '@heroicons/react/24/outline'

export default function EmployeePage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="flex">
        {/* Single responsive sidebar - always in the DOM. On small screens it's off-canvas and translates in/out. */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 sm:static sm:transform-none flex flex-col w-56 max-w-[78%] sm:w-64 sm:max-w-none sm:h-screen p-6 overflow-y-auto`}
          style={{ background: 'var(--color-secondary)', color: 'white' }}
          aria-hidden={!mobileOpen}
        >
          {/* Close button for mobile drawer */}
          <button className="sm:hidden absolute top-4 right-4 p-2 text-white text-xl leading-none" aria-label="Close menu" onClick={() => setMobileOpen(false)}>✕</button>
          <div className="mb-6">
            <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} />
          </div>
          <div className="rounded-md p-4 mb-6 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <div className="font-semibold">Employé(e)</div>
            <div className="text-sm text-white/70">Bienvenue</div>
          </div>

          <nav className="flex-1">
            <ul className="space-y-3">
              <li className="rounded-md py-3 px-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                <HomeIcon className="w-5 h-5" />
                <span className="font-medium">Accueil</span>
              </li>
              <li className="text-white/80 hover:text-white py-3 px-2 flex items-center gap-3">
                <ClockIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <span>Pointage</span>
              </li>
              <li className="text-white/80 hover:text-white py-3 px-2 flex items-center gap-3">
                <UserIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <span>Profil</span>
              </li>
            </ul>
          </nav>

          <div className="mt-6">
            <button className="flex items-center gap-3 text-white/80 hover:text-white" onClick={() => setMobileOpen(false)}>
              <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

  {/* overlay backdrop (small screens) */}
  <div className={`${mobileOpen ? 'block' : 'hidden'} fixed inset-0 bg-black/40 z-40 sm:hidden`} onClick={() => setMobileOpen(false)} aria-hidden={!mobileOpen} />

        {/* Main area */}
  <div className={`flex-1 ${mobileOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {/* top bar mobile */}
          <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-md" style={{ color: 'var(--color-secondary)' }}>
              <Bars3Icon className="w-6 h-6" />
            </button>
            <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
            <div />
          </header>

          <main className="p-6 sm:p-10 min-h-screen">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-[rgba(236,77,54,0.06)]">
                  <ClockIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Bienvenue, Employé(e)</h1>
                  <p className="text-gray-600">Accédez à vos pointages et gérez votre temps de travail</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid var(--color-primary)' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(236,77,54,0.08)' }}>
                    <ClockIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Pointer</h2>
                  <p className="text-gray-600">Enregistrez vos heures de travail</p>
                </div>
              </article>

              <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #7a5bdc' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(122,91,220,0.08)' }}>
                    <UserIcon className="w-8 h-8" style={{ color: '#7a5bdc' }} />
                  </div>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Profil</h2>
                  <p className="text-gray-600">Gérez vos informations</p>
                </div>
              </article>

              <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #3bb273' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(59,178,115,0.08)' }}>
                    <ChartBarIcon className="w-8 h-8" style={{ color: '#3bb273' }} />
                  </div>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Statistiques</h2>
                  <p className="text-gray-600">Visualisez vos temps de travail</p>
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}