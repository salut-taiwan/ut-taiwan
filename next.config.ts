import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'tbo.karunika.co.id',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Forward storage-proxy requests from the frontend origin to the backend.
    // Keeping these on the same origin as the page avoids CORS/CORP and
    // Next.js `images.remotePatterns` requirements.
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
    const backend = api.replace(/\/api\/?$/, '');
    return [
      { source: '/api/storage/:path*', destination: `${backend}/api/storage/:path*` },
    ];
  },
};

export default nextConfig;
