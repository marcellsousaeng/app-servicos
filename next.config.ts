const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {}, // Mantém para silenciar o erro do Turbopack
  },
};

module.exports = withPWA(nextConfig);