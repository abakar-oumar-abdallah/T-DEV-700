'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import EmployeeSidebar from './EmployeeSidebar';
import Loader from './Loader';
import PageTransition from './PageTransition';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useTeam } from '@/contexts/TeamContext';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoading: teamLoading } = useTeam();
  
  // Pages that should not show the sidebar
  const noSidebarPages = ['/login', '/'];
  const showSidebar = !noSidebarPages.includes(pathname);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  if (!showSidebar) {
    return (
      <>
        <Loader 
          isLoading={teamLoading} 
          message="Vérification de l'authentification..."
        />
        <PageTransition>
          {children}
        </PageTransition>
      </>
    );
  }

  return (
    <>
      <Loader 
        isLoading={teamLoading} 
        message="Vérification de l'authentification..."
      />
      
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        
        <div className={`${mobileOpen ? 'block' : 'hidden'} fixed inset-0 bg-black/40 z-40 sm:hidden transition-opacity duration-300`} onClick={() => setMobileOpen(false)} />
        
        <div className="min-h-screen sm:ml-64">
          <header className="sm:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-30 transition-all duration-300">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="p-2 rounded-md transition-all duration-200 hover:bg-gray-100 active:scale-95" 
              style={{ color: 'var(--color-secondary)' }}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <Image src="/2clocktitle.svg" alt="2Clock" width={120} height={34} />
            <div />
          </header>
          
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </>
  );
}