/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' for Vercel deployment (enables API routes)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
