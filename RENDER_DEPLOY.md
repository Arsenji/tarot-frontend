# Настройки деплоя на Render

## Repository
```
https://github.com/Arsenji/tarot-frontend.git
```

## Branch
```
main
```

## Root Directory
```
(оставить пустым)
```

## Build Command
```bash
npm install && npm run build
```

## Publish Directory
```
.next
```

## Start Command
```bash
npm start
```

## Environment Variables

Добавьте следующие переменные окружения в настройках Render:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=tarolog_app_bot
NEXT_PUBLIC_ENVIRONMENT=production
```

## Node.js Version

Версия Node.js автоматически определяется из `.nvmrc` файла (20.x).

## Проверка перед деплоем

Перед каждым деплоем локально выполняйте:

```bash
npm run build
```

Если сборка проходит успешно локально, она пройдет и на Render.
