import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // opcional, sólo si también quieres que no bloquee por TS
  transpilePackages: ["@arete-studio/ui"],
  experimental: {
    optimizePackageImports: ["@arete-studio/ui"]
  }
};





export default nextConfig;
// If you're using TypeScript, you can also export `nextConfig` as `NextConfig` type
// export default nextConfig as NextConfig;
// module.exports = nextConfig;
// export default nextConfig as NextConfig;
// module.exports = nextConfig;


