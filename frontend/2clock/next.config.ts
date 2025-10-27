import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_MODE === 'production' ? 'export' : undefined,
  distDir: process.env.BUILD_MODE === 'production' ? 'out' : '.next',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;