import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_PLEX_SERVER_URL: process.env.PLEX_SERVER_URL,
    NEXT_PUBLIC_PLEX_SERVER_ID: process.env.PLEX_SERVER_ID,
  },
};

export default nextConfig;
