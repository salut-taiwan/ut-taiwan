import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/supabase-storage/:path*',
        destination: `${process.env.SUPABASE_URL}/storage/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'tbo.karunika.co.id',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
