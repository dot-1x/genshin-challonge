import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gi.yatta.moe",
        pathname: "/assets/**",
      },
    ],
  },
  allowedDevOrigins: ['zexlab']
};

export default nextConfig;
