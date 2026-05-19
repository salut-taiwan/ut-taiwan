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
};

export default nextConfig;
