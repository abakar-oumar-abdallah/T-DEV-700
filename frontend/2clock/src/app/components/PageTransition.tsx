'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Start exit animation
    setIsExiting(true);
    setIsEntering(false);
    
    // After exit animation completes, update content and start enter animation
    const exitTimer = setTimeout(() => {
      setDisplayChildren(children);
      setIsExiting(false);
      setIsEntering(true);
      
      // Remove enter state after animation completes
      const enterTimer = setTimeout(() => {
        setIsEntering(false);
      }, 400); // Duration of enter animation
      
      return () => clearTimeout(enterTimer);
    }, 250); // Duration of exit animation

    return () => clearTimeout(exitTimer);
  }, [pathname, children, mounted]);

  // Don't render anything on first mount to prevent flash
  if (!mounted) {
    return (
      <div className="min-h-screen opacity-0">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Page content with smooth transitions */}
      <div 
        className={`transition-all duration-300 ease-out ${
          isExiting 
            ? 'opacity-0 transform translate-x-[-20px] scale-[0.98]' 
            : isEntering
            ? 'opacity-100 transform translate-x-0 scale-100'
            : 'opacity-100 transform translate-x-0 scale-100'
        } ${isEntering ? 'animate-page-enter' : ''}`}
      >
        {displayChildren}
      </div>
    </div>
  );
}