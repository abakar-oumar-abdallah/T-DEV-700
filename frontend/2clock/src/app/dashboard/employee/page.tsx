"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {HomeIcon,ClockIcon,UserIcon,ChartBarIcon,Bars3Icon,ArrowRightOnRectangleIcon,} from '@heroicons/react/24/outline'
import EmployeeSidebar from '@/app/components/EmployeeSidebar'
export default function EmployeePage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const userPrenomStr = localStorage.getItem('userPrenom')!;
  const userNomStr = localStorage.getItem('userNom')!;
  
  const pathname = usePathname() || ''
  const isActive = (path: string) => pathname === path || pathname.startsWith(path)

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
              <Link href="/dashboard/clock">
                <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid var(--color-primary)' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(236,77,54,0.08)' }}>
                      <ClockIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Pointer</h2>
                    <p className="text-gray-600">Enregistrez vos heures de travail</p>
                  </div>
                </article>
              </Link>

              <Link href="/dashboard/employee/profile">
                <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #7a5bdc' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(122,91,220,0.08)' }}>
                      <UserIcon className="w-8 h-8" style={{ color: '#7a5bdc' }} />
                    </div>
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Profil</h2>
                    <p className="text-gray-600">Gérez vos informations</p>
                  </div>
                </article>
              </Link>

              <Link href="/dashboard/employee/punches">
                <article className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" style={{ borderTop: '4px solid #3bb273' }}>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-full mb-4" style={{ background: 'rgba(59,178,115,0.08)' }}>
                      <ChartBarIcon className="w-8 h-8" style={{ color: '#3bb273' }} />
                    </div>
                    <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Statistiques</h2>
                    <p className="text-gray-600">Visualisez vos temps de travail</p>
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