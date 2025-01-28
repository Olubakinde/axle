import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns:   [
      {
        protocol: "https",
        hostname: 'liveblocks.io',
        post: ''
      }
    ]
  }
};

export default nextConfig;
