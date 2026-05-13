import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  productionBrowserSourceMaps: true,
  experimental: {
    serverSourceMaps: true,
  },
};

export default nextConfig;
