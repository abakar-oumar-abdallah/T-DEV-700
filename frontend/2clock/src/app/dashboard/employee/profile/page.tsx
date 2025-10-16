"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
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

  useEffect(() => {
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
    <div className="min-h-screen flex bg-[var(--color-background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Overlay mobile */}
      <div
        className={`${
          mobileOpen ? "block" : "hidden"
        } fixed inset-0 bg-black/40 z-40 sm:hidden`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 sm:ml-64 flex flex-col items-center px-4 py-6 sm:py-10 transition-all">
        {/* Header mobile */}
        <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20 w-full">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md">
            <Bars3Icon className="w-6 h-6 text-[var(--color-secondary)]" />
          </button>
          <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
          <div />
        </header>

        {/* Profile card */}
        <main className="w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl bg-white shadow-lg rounded-2xl p-6 sm:p-8 mt-6 border border-gray-100">
          {/* Avatar + nom */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[var(--color-primary)]/40 mb-4 shadow-sm">
              <img
                src={`https://api.dicebear.com/5.x/initials/svg?seed=${user.first_name[0]}${user.last_name[0]}`}
                alt="Avatar de profil"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-secondary)] text-center">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1 text-center">
              {user.permission}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4">
            {[
              { label: "Prénom", name: "first_name" },
              { label: "Nom", name: "last_name" },
              { label: "Email", name: "email" },
              { label: "Téléphone", name: "phone" },
              { label: "Mot de passe", name: "password", type: "password" },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-[var(--color-secondary)] mb-1">
                  {label}
                </label>
                <input
                  type={type || "text"}
                  name={name}
                  value={(form as any)[name] || ""}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-gray-100 focus:outline-none transition"
                  placeholder={name === "password" ? "••••••••" : ""}
                />
              </div>
            ))}
          </form>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 sm:gap-0">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              Créé le :{" "}
              <span className="font-medium text-[var(--color-secondary)]">
                {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition"
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}