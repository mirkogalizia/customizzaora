import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
