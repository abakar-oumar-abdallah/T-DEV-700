'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CheckAuth } from '@/auth/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      // Vérifier si on a un token
      const token = localStorage.getItem('session');

      if (!token) {
        // Pas de token -> rediriger vers login
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Vérifier que le token est valide
      const result = await CheckAuth();

      if (!result.success) {
        // Token invalide -> nettoyer et rediriger
        localStorage.clear();
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Token valide
      setIsAuthenticated(true);
    };

    verifyAuth();
  }, [router, pathname]);

  // Afficher un loader pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  // Afficher le contenu seulement si authentifié
  return isAuthenticated ? <>{children}</> : null;
}
