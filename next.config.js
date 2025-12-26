/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убрано output: 'standalone' для совместимости с Render.com
  // output: 'standalone',
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
  // Настройки для обработки ошибок загрузки чанков
  onDemandEntries: {
    // Период в мс, в течение которого страницы остаются в памяти
    maxInactiveAge: 25 * 1000,
    // Количество страниц, которые должны одновременно оставаться в памяти
    pagesBufferLength: 2,
  },
  // Отключаем агрессивное кеширование для статических чанков
  generateBuildId: async () => {
    // Используем timestamp для уникальности сборки
    return `build-${Date.now()}`;
  },
}

module.exports = nextConfig
