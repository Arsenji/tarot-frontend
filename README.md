# Tarot Frontend

Фронтенд для Telegram-бота Таро на Next.js.

## Технологии

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Telegram WebApp SDK

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run dev
```

## Сборка для продакшена

```bash
npm run build
```

## Запуск продакшен версии

```bash
npm start
```

## Переменные окружения

- `NEXT_PUBLIC_API_URL` - URL бэкенда
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - Имя бота в Telegram
- `NEXT_PUBLIC_ENVIRONMENT` - Окружение (development/production)

## Деплой на Render

1. Подключите репозиторий к Render
2. Настройте переменные окружения
3. Build Command: `npm run build`
4. Publish Directory: `.next`
