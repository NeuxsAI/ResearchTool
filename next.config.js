/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  },
  serverExternalPackages: ['pdf-parse', 'canvas'],
  webpack: (config, { isServer }) => {
    // Handle canvas module
    if (isServer) {
      config.externals = [...config.externals, 'canvas'];
    }

    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/app': './src/app'
    };

    return config;
  },
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
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  trailingSlash: false,
  skipMiddlewareUrlNormalize: true,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  staticPageGenerationTimeout: 120,
  devIndicators: {
    appIsrStatus: false,
  }
};

module.exports = nextConfig; 