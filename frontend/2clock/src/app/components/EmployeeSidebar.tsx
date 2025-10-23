"use client";

import React, { useEffect } from "react";
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

  const userPrenomStr = user?.first_name ?? '';
  const userNomStr = user?.last_name ?? '';

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
          className="sm:hidden absolute top-4 left-4 p-2 text-white text-2xl z-50"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
        >
          ✕
        </button>

        <div className="flex justify-center items-center mt-8 mb-6">
          <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} />
        </div>

        <div
          className="rounded-md p-4 mb-6 text-center mx-6"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          {currentTeam ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-1">
                <BuildingOffice2Icon className="w-4 h-4 text-white/70" />
                <div className="font-semibold">{currentTeam.team.name}</div>
              </div>
              <div className="text-sm text-white/70 capitalize">
                {currentTeam.role === 'manager' ? 'Responsable' : 'Employé'}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">Employé(e)</div>
              <div className="text-sm text-white/70">Bienvenue</div>
            </>
          )}
        </div>

        {/* Liens */}
        <nav className="flex-1 px-6">
          <ul className="space-y-3">
            <li>
              <Link
                href="/dashboard/employee"
                className={`${
                  isActive("/dashboard/employee") && !isActive("/dashboard/employee/punches")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
                onClick={() => setMobileOpen(false)}
              >
                <HomeIcon className="w-5 h-5 " style={{
                    color: isActive("/dashboard/employee") && !isActive("/dashboard/employee/punches")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }} />
                <span className="font-medium">Accueil</span>
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard/clock"
                className={`${
                  isActive("/dashboard/clock")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
                onClick={() => setMobileOpen(false)}
              >
                <ClockIcon
                  className="w-6 h-6"
                  style={{
                    color: isActive("/dashboard/clock")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }}
                />
                <span>Pointage</span>
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard/employee/punches"
                className={`${
                  isActive("/dashboard/employee/punches")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
                onClick={() => setMobileOpen(false)}
              >
                <ChartBarIcon
                  className="w-6 h-6"
                  style={{
                    color: isActive("/dashboard/employee/punches")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }}
                />
                <span className="font-medium">Statistiques</span>
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard/employee/profile"
                className="text-white/80 hover:text-white py-3 px-4 flex items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <UserIcon className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                <span>Profil</span>
              </Link>
            </li>

            <li>
              <Link
                href="/teams"
                className={`${
                  isActive("/teams")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
                onClick={() => setMobileOpen(false)}
              >
                <BuildingOffice2Icon className="w-6 h-6"
                  style={{
                    color: isActive("/teams")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }} />
                <span className="font-medium">Équipes</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-6 px-6 pb-6">
            <button className="flex items-center gap-3 text-white/80 hover:text-white">
              <Image src={`https://api.dicebear.com/5.x/initials/svg?seed=${userPrenomStr.substr(0, 1)}${userNomStr.substr(0, 1)}`} alt='Image de profile' width={40} height={40} style={{ borderRadius: '50%' }} />
              <span>{userPrenomStr} {userNomStr}</span>
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