/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/system'],
  async rewrites() {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
    let targetUrl = 'https://medizoserver.vercel.app/api';
    if (envUrl) {
      let cleanUrl = envUrl.trim().replace(/\/+$/, '');
      cleanUrl = cleanUrl.replace(/\/health(\/api)?$/, '');
      cleanUrl = cleanUrl.replace(/\/api$/, '');
      targetUrl = `${cleanUrl}/api`;
    }
    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
