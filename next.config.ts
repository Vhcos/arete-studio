import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // opcional, sólo si también quieres que no bloquee por TS
};

export default nextConfig;
