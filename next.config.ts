import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stage.leihlokal-ka.de',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
