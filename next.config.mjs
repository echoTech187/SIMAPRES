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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
