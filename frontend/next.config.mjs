/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos.hotelbeds.com',
      },
    ],
  },
}

export default nextConfig
