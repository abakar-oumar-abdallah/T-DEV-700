"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useTeam } from "@/contexts/TeamContext";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function EmployeeSidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path);
  const { currentTeam, user } = useTeam();
  const [mounted, setMounted] = useState(false);

  const userPrenomStr = user?.first_name ?? '';
  const userNomStr = user?.last_name ?? '';
  const canManageCurrentTeam = currentTeam?.role === 'manager' || currentTeam?.role === 'owner';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prevent body scroll when sidebar opens on mobile
    if (window.innerWidth < 640) {
      document.body.style.overflow = mobileOpen ? "hidden" : "";
    }
  }, [mobileOpen]);

  // Prevent scroll propagation on sidebar - ONLY prevent at scroll limits
  useEffect(() => {
    const sidebarContainer = document.querySelector('aside.sidebar-container');
    if (!sidebarContainer) return;

    let lastTouchY = 0;

    const handleWheel = (e: WheelEvent) => {
      const element = sidebarContainer as HTMLElement;
      const isScrollable = element.scrollHeight > element.clientHeight;
      
      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const canScrollDown = e.deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight;
      const canScrollUp = e.deltaY < 0 && element.scrollTop > 0;

      if (!canScrollDown && !canScrollUp) {
        e.preventDefault();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const element = sidebarContainer as HTMLElement;
      const currentY = e.touches[0].clientY;
      const diff = currentY - lastTouchY;

      const canScrollDown = diff < 0 && element.scrollTop + element.clientHeight < element.scrollHeight;
      const canScrollUp = diff > 0 && element.scrollTop > 0;

      if (!canScrollDown && !canScrollUp) {
        e.preventDefault();
      }

      lastTouchY = currentY;
    };

    sidebarContainer.addEventListener('wheel', handleWheel, { passive: false });
    sidebarContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    sidebarContainer.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      sidebarContainer.removeEventListener('wheel', handleWheel);
      sidebarContainer.removeEventListener('touchstart', handleTouchStart);
      sidebarContainer.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('session');
    window.location.href = '/login';
  };

  const handleTeamClick = () => {
    if (canManageCurrentTeam) {
      router.push('/dashboard/manager/team');
      setMobileOpen(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          margin: 16px 0;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Fixed height with proper viewport handling */
        .sidebar-container {
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          /* Use 100dvh (dynamic viewport height) on mobile, falls back to 100vh */
          height: 100dvh;
          height: 100vh;
        }

        /* Ensure nav doesn't have its own scroll t */
        .sidebar-container nav {
          overflow: visible;
        }

        /* Add safe area padding for notched devices */
        @supports (padding: max(0px)) {
          .sidebar-container {
            padding-bottom: max(0px, env(safe-area-inset-bottom));
          }
        }
      `}</style>

      <aside
        className={`fixed top-0 left-0 z-50 transform transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        sm:translate-x-0
        sm:h-screen
        flex flex-col w-[100vw] sm:w-64 sidebar-container sidebar-scrollbar`}
        style={{
          background: "var(--color-secondary)",
          color: "white",
        }}
      >
        <button
          className="sm:hidden absolute top-4 left-4 p-2 text-white text-2xl z-50 rounded-full hover:bg-white/10 transition-all duration-300 hover:rotate-90"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
        >
          ✕
        </button>

        <div className={`flex justify-center items-center mt-8 mb-6 transition-all duration-700 flex-shrink-0 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} className="drop-shadow-lg" />
        </div>

        {/* Card équipe/utilisateur - Cachée pour superadmin */}
        {user?.permission !== 'superadmin' && (
          <div
            onClick={handleTeamClick}
            className={`rounded-xl p-4 mb-6 mx-6 text-center backdrop-blur-sm transition-all duration-300 group relative overflow-hidden flex-shrink-0 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            } ${
              canManageCurrentTeam 
                ? isActive("/dashboard/manager/team")
                  ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105 cursor-pointer'
                  : 'cursor-pointer hover:bg-white/15 active:scale-95'
                : ''
            }`}
            style={{ 
              backgroundColor: canManageCurrentTeam && isActive("/dashboard/manager/team") 
                ? 'var(--color-primary)' 
                : "rgba(255,255,255,0.08)", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)" 
            }}
          >
            {canManageCurrentTeam && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
            {currentTeam ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    canManageCurrentTeam ? 'group-hover:scale-110' : ''
                  } ${
                    isActive("/dashboard/manager/team") ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    <BuildingOffice2Icon 
                      className="w-5 h-5 relative z-10 transition-transform duration-300" 
                      style={{
                        color: isActive("/dashboard/manager/team") && canManageCurrentTeam
                          ? "var(--color-secondary)"
                          : "var(--color-primary)"
                      }}
                    />
                  </div>
                </div>
                <div className={`font-bold text-lg relative z-10 ${
                  isActive("/dashboard/manager/team") && canManageCurrentTeam
                    ? 'text-[var(--color-secondary)]' 
                    : ''
                }`}>{currentTeam.team.name}</div>
                <div className={`text-sm mt-1 capitalize relative z-10 ${
                  isActive("/dashboard/manager/team") && canManageCurrentTeam
                    ? 'text-[var(--color-secondary)]/80'
                    : 'text-white/70'
                }`}>
                  {currentTeam.role !== 'employee' ? (currentTeam.role === 'manager' ? 'Responsable' : 'Propriétaire') : 'Employé'}
                </div>
                {canManageCurrentTeam && (
                  <div className={`text-xs mt-2 flex items-center justify-center gap-1 relative z-10 transition-all duration-300 ${
                    isActive("/dashboard/manager/team")
                      ? 'text-[var(--color-secondary)]/60'
                      : 'text-white/50 group-hover:text-white/70'
                  }`}>
                    <span>Gérer l'équipe</span>
                    <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-bold text-lg">Bienvenue sur votre espace</div>
              </>
            )}
          </div>
        )}

        {/* Liens - Scrollable content with independent scroll */}
        <nav className="px-6 flex-1">
          <ul className="space-y-2">
            {/* Lien Accueil - Caché pour superadmin */}
            {user?.permission !== 'superadmin' && currentTeam && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '100ms' }}>
                <Link
                  href="/dashboard"
                  className={`${
                    pathname === "/dashboard"
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <HomeIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{
                      color: pathname === "/dashboard"
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }} />
                  <span className="font-medium relative z-10">Accueil</span>
                </Link>
              </li>
            )}

            {/* TOTP Code page - Only for managers */}
            {canManageCurrentTeam && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '200ms' }}>
                <Link
                  href="/dashboard/code"
                  className={`${
                    isActive("/dashboard/code")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ShieldCheckIcon 
                    className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: isActive("/dashboard/code")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }} 
                  />
                  <span className="font-medium relative z-10">Code TOTP</span>
                </Link>
              </li>
            )}

            {/* Lien Pointage - Caché pour superadmin */}
            {user?.permission !== 'superadmin' && currentTeam && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '300ms' }}>
                <Link
                  href="/dashboard/clock"
                  className={`${
                    isActive("/dashboard/clock")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ClockIcon
                    className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                    style={{
                      color: isActive("/dashboard/clock")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }}
                  />
                  <span className="font-medium relative z-10">Pointage</span>
                </Link>
              </li>
            )}
            
            {canManageCurrentTeam && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '400ms' }}>
                <Link
                  href="/dashboard/kpi"
                  className={`${
                    isActive("/dashboard/kpi")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ChartBarIcon
                    className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: isActive("/dashboard/kpi")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }}
                  />
                  <span className="font-medium relative z-10">Statistiques</span>
                </Link>
              </li>
            )}

            {/* Lien Équipes - Caché pour superadmin */}
            {user?.permission !== 'superadmin' && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '500ms' }}>
                <Link
                  href="/teams"
                  className={`${
                    isActive("/teams")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <BuildingOffice2Icon className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: isActive("/teams")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }} />
                  <span className="font-medium relative z-10">Équipes</span>
                </Link>
              </li>
            )}

            {/* Lien Superadmin - Seulement pour superadmin */}
            {user?.permission === 'superadmin' && (
              <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '100ms' }}>
                <Link
                  href="/dashboard/superadmin"
                  className={`${
                    isActive("/dashboard/superadmin")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <ShieldCheckIcon className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      color: isActive("/dashboard/superadmin")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }} />
                  <span className="font-medium relative z-10">Superadmin</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Profil en bas - Design amélioré - Scrollable to */}
        <div className={`px-6 pb-6 space-y-3 transition-all duration-700 flex-shrink-0 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          {/* Carte profil */}
          <Link 
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`block rounded-xl p-3 mb-3 ${
              isActive("/profile")
                ? "bg-[var(--color-primary)] shadow-lg"
                : "bg-white/5 hover:bg-white/10"
            } transition-all duration-300 backdrop-blur-sm group`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`absolute inset-0 bg-white/10 rounded-full  group-hover:opacity-75 transition-opacity duration-300`} />
                <Image 
                  src={`https://api.dicebear.com/5.x/initials/svg?seed=${userPrenomStr.substr(0, 1)}${userNomStr.substr(0, 1)}`} 
                  alt='Image de profile' 
                  width={48} 
                  height={48} 
                  className="rounded-full border-2 border-white/10 group-hover:border-[var(--color-primary)]/30 transition-all duration-300 group-hover:scale-105" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate transition-colors duration-300 ${
                  isActive("/profile")
                    ? "text-[var(--color-secondary)]"
                    : "text-white group-hover:text-[var(--color-primary)]"
                }`}>
                  {userPrenomStr || "Inconnu"} {userNomStr || ""}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isActive("/profile")
                    ? "text-[var(--color-secondary)]/70"
                    : "text-white/60 group-hover:text-white/80"
                }`}>
                  Voir le profil
                </div>
              </div>
              <svg className="w-4 h-4 text-white/30 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full rounded-xl p-3.5 bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 backdrop-blur-sm group flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/30"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-all duration-300 group-hover:translate-x-0.5" />
            <span className="font-medium text-red-400 group-hover:text-red-300 transition-colors duration-300">Déconnexion</span>
          </button>
        </div>
      </aside>

      <div
        className={`${
          mobileOpen ? "block" : "hidden"
        } fixed inset-0 bg-black/40 z-40 sm:hidden`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
    </>
  );
}