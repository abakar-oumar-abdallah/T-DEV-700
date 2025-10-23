"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Bars3Icon, UserCircleIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon, CalendarIcon } from "@heroicons/react/24/outline";
import EmployeeSidebar from "@/app/components/EmployeeSidebar";

interface User {
  id: string;
  permission: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export default function EmployeeProfilePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fakeUser: User = {
      id: "1",
      permission: "Employé",
      email: "jd@example.com",
      first_name: "jdev",
      last_name: "deghaimi",
      phone: "+33 6 00 00 00 00",
      password: "",
      created_at: "2024-03-10T09:00:00Z",
      updated_at: "2025-10-10T10:00:00Z",
    };
    setUser(fakeUser);
    setForm(fakeUser);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setEditing(false);
    console.log("Données à enregistrer :", form);
  };

  if (!user)
    return (
      <div className="flex justify-center items-center min-h-screen text-[var(--color-secondary)] font-medium">
        Chargement...
      </div>
    );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col w-full">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20 w-full shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md">
            <Bars3Icon className="w-6 h-6" style={{ color: "var(--color-secondary)" }} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Mon Profil</h1>
          <div className="w-10" />
        </header>

        {/* Main content - CENTRÉ */}
        <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
          <div className={`w-full max-w-2xl transform transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            {/* Profile card */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              {/* Header avec gradient */}
              <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[var(--color-primary)] via-[#ff6b4a] to-[#ff8c6b] overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
              </div>

              {/* Avatar - chevauchement avec le header */}
              <div className="relative px-6 sm:px-8 pb-6">
                <div className="flex flex-col items-center -mt-16 sm:-mt-20">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[var(--color-primary)] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl transform transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={`https://api.dicebear.com/5.x/initials/svg?seed=${user.first_name[0]}${user.last_name[0]}`}
                        alt="Avatar de profil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-bold mt-4 bg-gradient-to-r from-[var(--color-secondary)] to-gray-700 bg-clip-text text-transparent text-center">
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-gradient-to-r from-[rgba(236,77,54,0.1)] to-[rgba(236,77,54,0.05)] rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                      {user.permission}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form avec icônes */}
              <div className="px-6 sm:px-8 pb-8">
                <form className="space-y-5">
                  {[
                    { label: "Prénom", name: "first_name", icon: UserCircleIcon, delay: "100ms" },
                    { label: "Nom", name: "last_name", icon: UserCircleIcon, delay: "200ms" },
                    { label: "Email", name: "email", icon: EnvelopeIcon, delay: "300ms" },
                    { label: "Téléphone", name: "phone", icon: PhoneIcon, delay: "400ms" },
                    { label: "Mot de passe", name: "password", type: "password", icon: LockClosedIcon, delay: "500ms" },
                  ].map(({ label, name, type, icon: Icon, delay }) => (
                    <div 
                      key={name}
                      className={`transform transition-all duration-500 ${
                        mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                      }`}
                      style={{ transitionDelay: delay }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                        {label}
                      </label>
                      <div className="relative group">
                        <input
                          type={type || "text"}
                          name={name}
                          value={(form as any)[name] || ""}
                          onChange={handleChange}
                          disabled={!editing}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none ${
                            editing 
                              ? 'border-gray-300 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(236,77,54,0.1)] bg-white' 
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                          placeholder={name === "password" ? "••••••••" : ""}
                        />
                        {editing && (
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </form>

                {/* Footer avec date et boutons */}
                <div className={`mt-8 pt-6 border-t border-gray-100 transform transition-all duration-700 ${
                  mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`} style={{ transitionDelay: '600ms' }}>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span>Créé le</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="group relative px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b4a] to-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center gap-2">
                          <UserCircleIcon className="w-5 h-5" />
                          Modifier mon profil
                        </span>
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditing(false)}
                          className="px-5 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium text-gray-700 hover:border-gray-400"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSave}
                          className="group relative px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <span className="relative">✓ Enregistrer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}