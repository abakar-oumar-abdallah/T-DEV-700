"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ClockIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import AnimatedWave from './components/AnimatedWave'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: <ClockIcon className="w-8 h-8" />,
      title: "Pointage Intelligent",
      description: "Système de pointage sécurisé avec codes TOTP à 6 chiffres, renouvelés toutes les 30 secondes"
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Statistiques Détaillées",
      description: "Analysez la ponctualité et les heures travaillées avec des graphiques interactifs et des KPI personnalisés"
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Gestion d'Équipes",
      description: "Créez et gérez plusieurs équipes avec des plannings personnalisés et des fuseaux horaires différents"
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Sécurité Renforcée",
      description: "Protection CSRF, validation TOTP en temps réel et authentification sécurisée pour toutes les opérations"
    }
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--color-secondary)] pb-20">
        <div className="max-w-7xl mx-auto px-6 py-20 sm:py-32">
          <div className={`text-center transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image 
                src="/2clocktitle.svg" 
                alt="2Clock Logo" 
                width={400} 
                height={56} 
              />
            </div>

            {/* Slogan */}
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 text-white leading-tight">
              <span className="text-[var(--color-primary)]">Deux</span> <span className="text-[var(--color-primary-hover)]">pointages</span>, et c&apos;est tout.
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
              Solution complète de gestion des pointages avec statistiques en temps réel, 
              plannings personnalisés et sécurité maximale
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group px-8 py-4 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                Accéder à l'application
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <a
                href="https://tally.so/r/ZjEK65"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-[var(--color-secondary)] rounded-xl font-semibold text-lg border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 hover:scale-105"
              >
                Demander une démo
              </a>
            </div>
          </div>
        </div>
        
        <AnimatedWave fillColor="white" animationDuration={12} />
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-white pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-secondary)] mb-4">
              Des fonctionnalités puissantes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement le temps de travail de vos équipes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[var(--color-primary)] transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <AnimatedWave fillColor="var(--color-primary-hover)" animationDuration={14} />
      </section>

      {/* Screenshots Section - Pointage & Code TOTP */}
      <section className="relative py-20 bg-[var(--color-primary-hover)] pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Pointage sécurisé et intuitif
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Un système de pointage moderne avec codes TOTP pour une sécurité maximale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* Clock Screenshot */}
            <div className={`transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '500ms' }}>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                <Image
                  src="/screenshots/screenshot-clockin.png"
                  alt="Système de pointage"
                  width={600}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-center text-gray-600 mt-4 text-lg font-medium">
                Interface de pointage simple avec code TOTP à 6 chiffres
              </p>
            </div>

            {/* TOTP Screenshot */}
            <div className={`transition-all duration-1000 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '600ms' }}>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                <Image
                  src="/screenshots/screenshot-totp.png"
                  alt="Code TOTP Manager"
                  width={600}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-center text-gray-600 mt-4 text-lg font-medium">
                Codes de validation renouvelés automatiquement toutes les 30 secondes
              </p>
            </div>
          </div>
        </div>
        
        <AnimatedWave fillColor="#F9FAFB" animationDuration={16} />
      </section>

      {/* Team Management Section */}
      <section className="relative py-20 bg-gray-50 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '700ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-secondary)] mb-4">
              Gestion d&apos;équipes simplifiée
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Organisez vos équipes, gérez les membres et leurs rôles en quelques clics
            </p>
          </div>

          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '800ms' }}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-shadow duration-300">
              <Image
                src="/screenshots/screenshot-team-management.png"
                alt="Gestion des équipes"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>
            <p className="text-center text-gray-600 mt-4 text-lg font-medium">
              Ajoutez des membres, définissez les rôles et gérez les plannings de chaque équipe
            </p>
          </div>
        </div>
        
        <AnimatedWave fillColor="var(--color-secondary)" animationDuration={13} />
      </section>

      {/* KPI Section */}
      <section className="relative py-20 bg-[var(--color-secondary)] pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '900ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Statistiques et analyses avancées
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Suivez la performance de vos équipes avec des KPI détaillés et des graphiques interactifs
            </p>
          </div>

          <div className={`max-w-5xl mx-auto transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '1000ms' }}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-white/20">
              <Image
                src="/screenshots/screenshot-kpi.png"
                alt="Statistiques et KPI"
                width={1200}
                height={675}
                className="w-full h-auto"
              />
            </div>
            <p className="text-center text-white/90 mt-4 text-lg font-medium">
              Analysez la ponctualité, les heures travaillées et exportez vos données en CSV
            </p>
          </div>
        </div>
        
        <AnimatedWave fillColor="white" animationDuration={15} />
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 bg-white pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '1100ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--color-secondary)] mb-4">
              Pourquoi choisir 2Clock ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: "Installation rapide et configuration simple" },
              { text: "Support multi-équipes et multi-fuseaux horaires" },
              { text: "Sécurité maximale avec authentification TOTP" },
              { text: "Statistiques en temps réel et exports CSV" },
              { text: "Interface responsive adaptée à tous les appareils" },
              { text: "Gestion des plannings personnalisés par équipe" }
            ].map((benefit, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 transition-all duration-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${1200 + index * 50}ms` }}
              >
                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        <AnimatedWave fillColor="var(--color-primary)" animationDuration={17} />
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-20 bg-[var(--color-primary)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className={`transition-all duration-1000 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`} style={{ transitionDelay: '1300ms' }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Prêt à transformer votre gestion du temps ?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Rejoignez les entreprises qui ont déjà optimisé leur gestion du temps de travail de leurs équipes avec 2Clock
            </p>
            
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-[var(--color-secondary)] mb-6">
                Demander une démo
              </h3>
              <p className="text-gray-600 mb-6">
                Remplissez notre formulaire pour obtenir un accès à 2Clock
              </p>
              <a
                href="https://tally.so/r/ZjEK65"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b4a] text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Accéder au formulaire
              </a>
              <p className="text-sm text-gray-500 mt-4">
                Ou <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">connectez-vous</Link> si vous avez déjà un compte
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[var(--color-secondary)] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/80">
                © {new Date().getFullYear()} 2Clock. Gestion intelligente du temps de travail.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}