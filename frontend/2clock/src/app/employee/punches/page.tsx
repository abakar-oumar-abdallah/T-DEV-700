"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const EmployeePunchesPage = () => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path);

  const punches = [
    {
      date: "2025-10-14",
      arrivee: "2025-10-14T08:00:00Z",
      depart: "2025-10-14T17:00:00Z",
    },
    {
      date: "2025-10-15",
      arrivee: "2025-10-15T09:15:00Z",
      depart: "2025-10-15T18:00:00Z",
    },
    {
      date: "2025-10-16",
      arrivee: "2025-10-16T08:45:00Z",
      depart: "2025-10-16T16:30:00Z",
    },
  ];

  const calculateHours = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(2);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
<<<<<<< HEAD
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 transform transition-transform duration-300 sm:translate-x-0 sm:static sm:transform-none flex flex-col w-56 max-w-[78%] sm:w-64 sm:max-w-none sm:h-screen p-6 overflow-y-auto"
        style={{ background: "var(--color-secondary)", color: "white" }}
      >
        <div className="mb-6">
          <Image src="/2clocktitle.svg" alt="2Clock" width={160} height={44} />
        </div>

        <div
          className="rounded-md p-4 mb-6 text-center"
          style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <div className="font-semibold">Employé(e)</div>
          <div className="text-sm text-white/70">Bienvenue</div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-3">
            <li>
              <Link
                href="/employee"
                className={`${
                  isActive("/employee") && !isActive("/employee/punches")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
              >
                <HomeIcon className="w-5 h-5" />
                <span className="font-medium">Accueil</span>
              </Link>
            </li>

            <li>
              <Link
                href="/employee/punches"
                className={`${
                  isActive("/employee/punches")
                    ? "bg-[var(--color-primary)] text-[var(--color-secondary)]"
                    : "text-white/80 hover:text-white"
                } rounded-md py-3 px-4 flex items-center gap-3`}
              >
                <ChartBarIcon
                  className="w-6 h-6"
                  style={{
                    color: isActive("/employee/punches")
                      ? "var(--color-secondary)"
                      : "var(--color-primary)",
                  }}
                />
                <span className="font-medium">Pointages</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-6">
          <button className="flex items-center gap-3 text-white/80 hover:text-white">
            <ArrowRightOnRectangleIcon
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
            />
            <span>Déconnexion</span>
=======
      <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 sm:ml-64 flex flex-col items-center w-full">
        <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20 w-full shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md">
            <Bars3Icon className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
>>>>>>> develop
          </button>
        </div>
      </aside>

      <div className="flex-1 sm:ml-64 flex justify-center items-center px-4 py-10">
        <main className="w-full max-w-4xl bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Historique des pointages
            </h1>
            <p className="text-gray-500 mt-2">
              Consultez vos heures de travail journalières
            </p>
          </div>

<<<<<<< HEAD
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
=======
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-sm md:text-base">
>>>>>>> develop
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm md:text-base">
                  <th className="py-3 px-4 text-left rounded-tl-lg">Date</th>
                  <th className="py-3 px-4 text-left">Arrivée</th>
                  <th className="py-3 px-4 text-left">Départ</th>
                  <th className="py-3 px-4 text-left rounded-tr-lg">
                    Heures travaillées
                  </th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {new Date(p.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(p.arrivee).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(p.depart).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--color-primary)]">
                      {calculateHours(p.arrivee, p.depart)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

<<<<<<< HEAD
          <div className="text-center mt-8 border-t pt-6">
            <p className="text-lg font-medium text-gray-700">
=======
          <div className="space-y-4 md:hidden">
            {punches.map((p, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg shadow p-4 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800 text-sm">
                    {new Date(p.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="text-[var(--color-primary)] font-bold text-sm">
                    {calculateHours(p.arrivee, p.depart)} h
                  </span>
                </div>
                <div className="text-gray-600 text-sm">
                  <div>🕓 Arrivée :{" "}
                    <span className="font-medium">
                      {new Date(p.arrivee).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>🏁 Départ :{" "}
                    <span className="font-medium">
                      {new Date(p.depart).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 border-t pt-6">
            <p className="text-base md:text-lg font-medium text-gray-700">
>>>>>>> develop
              Total des heures sur cette période :{" "}
              <span className="text-[var(--color-primary)] font-bold">
                {punches
                  .reduce(
                    (acc, p) =>
                      acc + parseFloat(calculateHours(p.arrivee, p.depart)),
                    0
                  )
                  .toFixed(2)}{" "}
                h
              </span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeePunchesPage;
