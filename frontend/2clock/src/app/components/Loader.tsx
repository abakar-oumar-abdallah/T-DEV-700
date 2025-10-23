'use client';
import React from 'react';
import Image from 'next/image';

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

export default function Loader({ isLoading, message = 'Chargement...' }: LoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px] transform transition-all duration-300 scale-100 animate-pulse">
        <div className="relative flex items-center justify-center">
          <div 
            className="w-16 h-16 rounded-full border-4 border-gray-200 animate-spin transition-all duration-300"
            style={{ borderTopColor: 'var(--color-primary)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image 
              src="/2clock.svg" 
              alt="2Clock" 
              width={32} 
              height={32} 
              className="opacity-80 transition-all duration-300 animate-pulse" 
            />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium transition-all duration-300" style={{ color: 'var(--color-secondary)' }}>
            {message}
          </p>
          <p className="text-sm text-gray-500 transition-all duration-300">Veuillez patienter...</p>
        </div>
      </div>
    </div>
  );
}