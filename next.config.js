/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' is only needed for static builds (next build), not for dev server
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/system'],
};

module.exports = nextConfig;

