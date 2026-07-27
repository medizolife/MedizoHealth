/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/system'],
  async rewrites() {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
    const targetUrl = envUrl ? (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`) : 'https://medizoserver.vercel.app/api';
    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
