/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'maps.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**/*': ['./node_modules/.prisma/client/**/*', './prisma/**/*'],
    },
  },
};

export default nextConfig;
