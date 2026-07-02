import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // cache dynamic pages for 30s on the client
    },
  },
};

export default nextConfig;
