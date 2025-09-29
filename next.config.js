const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  eslint: {
    // Отключаем ESLint во время сборки для Render.com
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Отключаем проверку типов во время сборки для Render.com
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
}

module.exports = nextConfig
