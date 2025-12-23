import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/friends",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
