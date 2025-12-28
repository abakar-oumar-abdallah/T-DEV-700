import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Désactiver l'optimisation des images pour la compatibilité
  images: {
    unoptimized: true,
  },
};

export default nextConfig;