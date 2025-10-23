"use client"

import React, { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { 
  Bars3Icon, 
  ArrowDownTrayIcon, 
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import EmployeeSidebar from "@/app/components/EmployeeSidebar"

type Punch = {
  date: string
  arrivee: string
  depart: string
}

type FilterPeriod = "all" | "week" | "month" | "custom"

const EmployeePunchesPage = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const allPunches: Punch[] = [
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
    {
      date: "2025-10-10",
      arrivee: "2025-10-10T08:30:00Z",
      depart: "2025-10-10T17:30:00Z",
    },
    {
      date: "2025-10-11",
      arrivee: "2025-10-11T09:00:00Z",
      depart: "2025-10-11T18:15:00Z",
    },
    {
      date: "2025-09-20",
      arrivee: "2025-09-20T08:00:00Z",
      depart: "2025-09-20T16:00:00Z",
    },
  ]

  const calculateHours = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60)
    return diff.toFixed(2)
  }

  // Filtrer les pointages selon la période
  const filteredPunches = useMemo(() => {
    const now = new Date()
    
    return allPunches.filter(p => {
      const punchDate = new Date(p.date)
      
      if (filterPeriod === "all") return true
      
      if (filterPeriod === "week") {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return punchDate >= weekAgo
      }
      
      if (filterPeriod === "month") {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return punchDate >= monthAgo
      }
      
      if (filterPeriod === "custom") {
        if (!customStartDate && !customEndDate) return true
        const start = customStartDate ? new Date(customStartDate) : new Date(0)
        const end = customEndDate ? new Date(customEndDate) : new Date()
        return punchDate >= start && punchDate <= end
      }
      
      return true
    })
  }, [filterPeriod, customStartDate, customEndDate])

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalHours = filteredPunches.reduce(
      (acc, p) => acc + parseFloat(calculateHours(p.arrivee, p.depart)),
      0
    )
    const avgHours = filteredPunches.length > 0 ? totalHours / filteredPunches.length : 0
    const totalDays = filteredPunches.length

    return {
      totalHours: totalHours.toFixed(2),
      avgHours: avgHours.toFixed(2),
      totalDays
    }
  }, [filteredPunches])

  // Exporter en CSV
  const exportToCSV = () => {
    const headers = ["Date", "Arrivée", "Départ", "Heures travaillées"]
    const rows = filteredPunches.map(p => [
      new Date(p.date).toLocaleDateString("fr-FR"),
      new Date(p.arrivee).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      new Date(p.depart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      `${calculateHours(p.arrivee, p.depart)} h`
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `pointages_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
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
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md">
            <Bars3Icon
              className="w-6 h-6"
              style={{ color: "var(--color-secondary)" }}
            />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Statistiques</h1>
        </header>

        <main className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header avec titre et boutons */}
          <div className={`bg-white rounded-xl shadow-lg p-5 sm:p-6 mb-5 sm:mb-6 transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] bg-clip-text text-transparent">
                  Historique des pointages
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Consultez vos heures de travail et statistiques
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-300 text-sm font-medium group"
                >
                  <FunnelIcon className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700">Filtres</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium group"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className={`bg-white rounded-xl shadow-lg p-5 sm:p-6 mb-5 sm:mb-6 transform transition-all duration-500 ${
              mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5 text-[var(--color-primary)]" />
                  Filtrer par période
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { value: "all", label: "Tout" },
                  { value: "week", label: "7 jours" },
                  { value: "month", label: "30 jours" },
                  { value: "custom", label: "Personnalisé" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterPeriod(option.value as FilterPeriod)}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      filterPeriod === option.value
                        ? "bg-[var(--color-primary)] text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {filterPeriod === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 sm:mb-6">
            <div className={`bg-white rounded-xl shadow-md p-5 sm:p-6 transform transition-all duration-500 hover:shadow-xl ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '100ms' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex-shrink-0">
                  <CalendarIcon className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-sm font-medium mb-1">Jours travaillés</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalDays}</p>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-md p-5 sm:p-6 transform transition-all duration-500 hover:shadow-xl ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '200ms' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-[rgba(236,77,54,0.15)] to-[rgba(236,77,54,0.05)] flex-shrink-0">
                  <ClockIcon className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-sm font-medium mb-1">Total heures</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {stats.totalHours}h
                  </p>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl shadow-md p-5 sm:p-6 transform transition-all duration-500 hover:shadow-xl ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`} style={{ transitionDelay: '300ms' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex-shrink-0">
                  <ChartBarIcon className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-sm font-medium mb-1">Moyenne/jour</p>
                  <p className="text-3xl font-bold text-green-600">{stats.avgHours}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tableau et données */}
          <div className={`bg-white rounded-xl shadow-lg p-5 sm:p-6 transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`} style={{ transitionDelay: '400ms' }}>
            {filteredPunches.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Aucun pointage trouvé
                </h3>
                <p className="text-gray-600">
                  Aucune donnée ne correspond aux filtres sélectionnés
                </p>
              </div>
            ) : (
              <>
                {/* TABLEAU DESKTOP */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700">
                        <th className="py-4 px-6 text-left font-semibold rounded-tl-xl">Date</th>
                        <th className="py-4 px-6 text-left font-semibold">Arrivée</th>
                        <th className="py-4 px-6 text-left font-semibold">Départ</th>
                        <th className="py-4 px-6 text-left font-semibold rounded-tr-xl">
                          Heures travaillées
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPunches.map((p, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="py-4 px-6 font-medium text-gray-800 group-hover:text-[var(--color-primary)] transition-colors">
                            {new Date(p.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              {new Date(p.arrivee).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {new Date(p.depart).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[rgba(236,77,54,0.1)] to-[rgba(236,77,54,0.05)] rounded-full font-semibold" style={{ color: 'var(--color-primary)' }}>
                              <ClockIcon className="w-4 h-4" />
                              {calculateHours(p.arrivee, p.depart)} h
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CARDS MOBILE & TABLET */}
                <div className="space-y-4 lg:hidden">
                  {filteredPunches.map((p, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-gray-800 text-base mb-1">
                            {new Date(p.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(p.date).toLocaleDateString("fr-FR", { year: "numeric" })}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[rgba(236,77,54,0.15)] to-[rgba(236,77,54,0.08)] rounded-full font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                          <ClockIcon className="w-4 h-4" />
                          {calculateHours(p.arrivee, p.depart)} h
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-bold text-lg">→</span>
                          </div>
                          <div>
                            <p className="text-xs text-green-700 font-medium">Arrivée</p>
                            <p className="text-sm font-bold text-green-800">
                              {new Date(p.arrivee).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 font-bold text-lg">←</span>
                          </div>
                          <div>
                            <p className="text-xs text-red-700 font-medium">Départ</p>
                            <p className="text-sm font-bold text-red-800">
                              {new Date(p.depart).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default EmployeePunchesPage