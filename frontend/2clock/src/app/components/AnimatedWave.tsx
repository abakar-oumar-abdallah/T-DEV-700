'use client'
import React from 'react'

interface AnimatedWaveProps {
  fillColor: string
  position?: 'top' | 'bottom'
  animationDuration?: number
}

export default function AnimatedWave({ 
  fillColor, 
  position = 'bottom',
  animationDuration = 15
}: AnimatedWaveProps) {
  // Récupérer la couleur réelle si c'est une variable CSS
  const getColor = () => {
    if (fillColor.startsWith('var(')) {
      // Extraire le nom de la variable
      const varName = fillColor.match(/var\((--[\w-]+)\)/)?.[1]
      if (varName && typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      }
    }
    return fillColor
  }

  const color = typeof window !== 'undefined' ? getColor() : fillColor

  return (
    <div className={`absolute ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 w-full`} style={{ marginBottom: -1 }}>
      <svg 
        viewBox="0 0 1440 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <path 
          d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" 
          fill={color}
        >
          <animate
            attributeName="d"
            dur={`${animationDuration}s`}
            repeatCount="indefinite"
            values="
              M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z;
              
              M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z;
              
              M0,96L48,85.3C96,75,192,53,288,48C384,43,480,53,576,58.7C672,64,768,64,864,58.7C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z;
              
              M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z
            "
          />
        </path>
      </svg>
    </div>
  )
}