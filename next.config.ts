import type { NextConfig } from 'next';
import dotenv from 'dotenv';

// Load .env into process.env (dotenv.populate is used internally to inject)
dotenv.config({ path: '.env', override: true });

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  // 'standalone' bundles everything needed to run the server independently —
  // required for Electron to embed and launch the Next.js server.
  output: process.env.BUILD_ELECTRON === '1' ? 'standalone' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PROJECT_ID: process.env.HAPPYSEEDS_PROJECT_ID ?? '',
    REACTUS_BASE_URL: process.env.REACTUS_BASE_URL ?? '',
  },
  serverExternalPackages: [],
  allowedDevOrigins: [
    "**.*.*",
  ],
};

export default nextConfig;

