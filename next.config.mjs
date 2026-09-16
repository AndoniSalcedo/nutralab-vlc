/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb'
    }
  },
  async redirects() {
    return [
      {
        source: '/cookies',
        destination: '/legal/cookies',
        permanent: true,
      },
      {
        source: '/privacidad',
        destination: '/legal/privacidad',
        permanent: true,
      },
      {
        source: '/aviso-legal',
        destination: '/legal/aviso-legal',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
