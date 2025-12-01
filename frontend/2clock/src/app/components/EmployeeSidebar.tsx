"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { useTeam } from "@/contexts/TeamContext";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function EmployeeSidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname() || "";
  const isActive = (path: string) => pathname === path || pathname.startsWith(path);
  const { currentTeam, user } = useTeam();
  const [mounted, setMounted] = useState(false);

  const userPrenomStr = user?.first_name ?? '';
  const userNomStr = user?.last_name ?? '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transform transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        sm:translate-x-0
        flex flex-col w-[100vw] sm:w-64 overflow-y-auto`}
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

        <div className={`flex justify-center items-center mt-8 mb-6 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} className="drop-shadow-lg" />
        </div>

        <div
          className={`rounded-xl p-4 mb-6 text-center mx-6 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          style={{ backgroundColor: "rgba(255,255,255,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        >
          {currentTeam ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-white/10">
                  <BuildingOffice2Icon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
              </div>
              <div className="font-bold text-lg">{currentTeam.team.name}</div>
              <div className="text-sm text-white/70 mt-1 capitalize">
                {currentTeam.role === 'manager' ? 'Responsable' : '👤 Employé'}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-lg">Employé(e)</div>
              <div className="text-sm text-white/80 mt-1">Bienvenue sur votre espace</div>
            </>
          )}
        </div>

        {/* Liens */}
        <nav className="flex-1 px-6">
          <ul className="space-y-2">
            <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '100ms' }}>
              <Link
                href="/dashboard/employee"
                className={`${
                  isActive("/dashboard/employee") && !isActive("/dashboard/employee/punches") && !isActive("/dashboard/employee/profile")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                onClick={() => setMobileOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <HomeIcon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{
                    color: isActive("/dashboard/employee") && !isActive("/dashboard/employee/punches") && !isActive("/dashboard/employee/profile")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }} />
                <span className="font-medium relative z-10">Accueil</span>
              </Link>
            </li>

 {/* TOTP Code page - Only for managers */}
            {currentTeam?.role === 'manager' && (
            <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '300ms' }}>
                <Link
                  href="/dashboard/code"
                  className={`${
                    isActive("/dashboard/code")
                      ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                      : "text-white/80 hover:text-white"
                  } rounded-md py-3 px-4 flex items-center gap-3`}
                  onClick={() => setMobileOpen(false)}
                >
                  <ShieldCheckIcon 
                    className="w-6 h-6"
                    style={{
                      color: isActive("/dashboard/code")
                        ? "var(--color-secondary)"
                        : "var(--color-primary)",
                    }} 
                  />
                  <span className="font-medium">Code TOTP</span>
                </Link>
              </li>
            )}
            
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
                <span className="relative z-10">Pointage</span>
              </Link>
            </li>

            <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '300ms' }}>
              <Link
                href="/dashboard/employee/punches"
                className={`${
                  isActive("/dashboard/employee/punches")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                onClick={() => setMobileOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ChartBarIcon
                  className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    color: isActive("/dashboard/employee/punches")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }}
                />
                <span className="font-medium relative z-10">Statistiques</span>
              </Link>
            </li>

            <li className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '400ms' }}>
              <Link
                href="/dashboard/employee/profile"
                className={`${
                  isActive("/dashboard/employee/profile")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-lg scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-xl py-3 px-4 flex items-center gap-3 transition-all duration-300 group relative overflow-hidden`}
                onClick={() => setMobileOpen(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <UserIcon className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ 
                  color: isActive("/dashboard/employee/profile")
                    ? "var(--color-secondary)"
                    : "var(--color-primary)" 
                }} />
                <span className="relative z-10">Profil</span>
              </Link>
            </li>

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
          </ul>
        </nav>

        <div className={`mt-auto px-6 pb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          <div className="rounded-xl p-3 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <Image 
                  src={`https://api.dicebear.com/5.x/initials/svg?seed=${userPrenomStr.substr(0, 1)}${userNomStr.substr(0, 1)}`} 
                  alt='Image de profile' 
                  width={44} 
                  height={44} 
                  className="relative rounded-full border-2 border-white/20 transform transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate group-hover:text-[var(--color-primary)] transition-colors duration-300">
                  {userPrenomStr || "Inconnu"} {userNomStr || ""}
                </div>
                <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300">Voir le profil</div>
              </div>
            </div>
          </div>
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