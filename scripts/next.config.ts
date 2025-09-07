import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@arete-studio/ui"], // si usas tu paquete UI
  experimental: {
    optimizePackageImports: ["@arete-studio/ui"],
  },
};

export default nextConfig;
