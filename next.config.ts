import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'tbo.karunika.co.id',
        pathname: '/**',
      },
      {
        // Module cover + product images are uploaded to Supabase Storage
        // (see ut-taiwan-be/services/scraperService.js uploadCoverImage).
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
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

export default withBundleAnalyzer(nextConfig);
