import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    // Cho phép upload media chat (ảnh/audio/video data-URL) qua Server Action.
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
