/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'maps.googleapis.com'],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**/*': ['./node_modules/.prisma/client/**/*', './prisma/**/*'],
    },
  },
};

export default nextConfig;
