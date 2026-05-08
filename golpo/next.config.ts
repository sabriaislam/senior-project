import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.RAILWAY_DEPLOYMENT_ID ?? Date.now().toString(),
  },
};

export default nextConfig;
