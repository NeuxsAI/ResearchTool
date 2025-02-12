import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@': path.resolve(__dirname, './src'),
      },
    };
    return config;
  },
};

export default nextConfig;
