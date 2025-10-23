"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {HomeIcon,ClockIcon,UserIcon,ChartBarIcon,Bars3Icon,ArrowRightOnRectangleIcon,} from '@heroicons/react/24/outline'
import EmployeeSidebar from '@/app/components/EmployeeSidebar'

export default function EmployeePage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const pathname = usePathname() || ''
  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

  useEffect(() => {
    setMounted(true)
  }, [])

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
                  <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />


  <div className={`${mobileOpen ? 'block' : 'hidden'} fixed inset-0 bg-black/40 z-40 sm:hidden`} onClick={() => setMobileOpen(false)} aria-hidden={!mobileOpen} />

  <div className={`flex-1 ${mobileOpen ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-md" style={{ color: 'var(--color-secondary)' }}>
              <Bars3Icon className="w-6 h-6" />
            </button>
            <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
            <div />
          </header>

          <main className="p-6 sm:p-10 min-h-screen">
            <div className={`bg-white rounded-xl shadow-lg p-8 mb-8 transform transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.1)] to-[rgba(236,77,54,0.05)] transform transition-transform hover:scale-110 duration-300">
                  <ClockIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                    Bienvenue, Employé(e)
                  </h1>
                  <p className="text-gray-600 mt-1">Accédez à vos pointages et gérez votre temps de travail</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/clock" className={`transform transition-all duration-500 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`} style={{ transitionDelay: '100ms' }}>
                <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[var(--color-primary)] hover:-translate-y-2 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(236,77,54,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(236,77,54,0.12)] to-[rgba(236,77,54,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <ClockIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Pointer</h2>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Enregistrez vos heures de travail</p>
                  </div>
                </article>
              </Link>

              <Link href="/dashboard/employee/profile" className={`transform transition-all duration-500 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`} style={{ transitionDelay: '200ms' }}>
                <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[#7a5bdc] hover:-translate-y-2 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(122,91,220,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(122,91,220,0.12)] to-[rgba(122,91,220,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <UserIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: '#7a5bdc' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Profil</h2>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Gérez vos informations</p>
                  </div>
                </article>
              </Link>

              <Link href="/dashboard/employee/punches" className={`transform transition-all duration-500 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`} style={{ transitionDelay: '300ms' }}>
                <article className="group bg-white rounded-xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-t-4 border-[#3bb273] hover:-translate-y-2 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,178,115,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="p-5 rounded-full mb-4 bg-gradient-to-br from-[rgba(59,178,115,0.12)] to-[rgba(59,178,115,0.05)] transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <ChartBarIcon className="w-9 h-9 transition-transform duration-300 group-hover:scale-110" style={{ color: '#3bb273' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 transition-colors duration-300" style={{ color: 'var(--foreground)' }}>Statistiques</h2>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Visualisez vos temps de travail</p>
                  </div>
                </article>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}