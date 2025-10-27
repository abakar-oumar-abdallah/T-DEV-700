"use client"
import React, { useState, useEffect } from "react"

export default function ManagerPage() {
  const [managerCode, setManagerCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(30)

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setManagerCode(code)
    
    // Enregistrer le code dans localStorage
    const codes = JSON.parse(localStorage.getItem("manager_codes") || "[]")
    codes.push({ code, created: Date.now() })
    localStorage.setItem("manager_codes", JSON.stringify(codes))
    
    setTimeLeft(30)
  }

  // Générer un code au chargement
  useEffect(() => {
    generateCode()
  }, [])

  // Régénérer le code toutes les 30 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateCode()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Manager</h1>
            <p className="text-gray-600">Partagez ce code avec vos employés pour valider leur pointage</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-3 font-medium">CODE DE VALIDATION</div>
              <div className="flex items-center justify-center gap-2 mb-6">
                {managerCode.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="w-14 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-4xl font-bold text-purple-600"
                  >
                    {digit}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">

                <span>Nouveau code dans {timeLeft}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}