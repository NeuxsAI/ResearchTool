/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
      serverActions: {
        bodySizeLimit: '50mb'
      }
    },
    serverExternalPackages: ['pdf-parse'],
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*'
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS'
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization'
            },
            {
              key: 'Access-Control-Allow-Credentials',
              value: 'true'
            }
          ]
        }
      ];
    },
    // Add configuration for handling dynamic routes
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
    trailingSlash: false,
    skipMiddlewareUrlNormalize: true,
    // Disable static optimization warning
    typescript: {
      ignoreBuildErrors: true
    },
    eslint: {
      ignoreDuringBuilds: true
    },
    staticPageGenerationTimeout: 120,
    devIndicators: {
      appIsrStatus: false,
    }, // Disable all dev indicators completely
  };
  
  module.exports = nextConfig;
  