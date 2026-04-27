const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Esta linha é crucial: ela força o cache de arquivos estáticos e páginas
  cacheOnFrontEndNav: true, 
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {},
  },
};

module.exports = withPWA(nextConfig);