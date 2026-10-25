/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: false,
    domains: ['localhost', 'simapres-nu.vercel.app', 'maps.googleapis.com'],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  outputFileTracingIncludes: {
    '/**/*': ['./node_modules/.prisma/client/**/*', './prisma/**/*'],
  },
};

export default nextConfig;
