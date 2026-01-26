/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // basePath: '/line-liff-mall-v2',
  // assetPrefix: '/line-liff-mall-v2',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
