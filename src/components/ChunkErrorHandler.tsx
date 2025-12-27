'use client';

import { useEffect } from 'react';

export function ChunkErrorHandler() {
  useEffect(() => {
    // Обработка ошибок загрузки чанков
    const handleError = (e: ErrorEvent) => {
      // Игнорируем ошибки WebSocket от Telegram (они не критичны для работы приложения)
      if (e.message && (
        e.message.includes('WebSocket') ||
        e.message.includes('MTProtoSender') ||
        e.message.includes('TelegramClient') ||
        e.message.includes('zws') ||
        e.message.includes('web.telegram.org') ||
        e.message.includes('PromisedWebSockets') ||
        e.message.includes('WebSocket connection timeout') ||
        e.message.includes('WebSocket connection failed')
      )) {
        // Тихо игнорируем ошибки Telegram WebSocket
        return;
      }

      if (e.message && e.message.includes('ChunkLoadError')) {
        console.log('ChunkLoadError detected, reloading page...');
        // Перезагружаем страницу при ошибке загрузки чанка
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Обработка unhandledrejection для промисов
    const handleRejection = (e: PromiseRejectionEvent) => {
      // Игнорируем ошибки WebSocket от Telegram
      if (e.reason && (
        (e.reason.message && (
          e.reason.message.includes('WebSocket') ||
          e.reason.message.includes('MTProtoSender') ||
          e.reason.message.includes('TelegramClient') ||
          e.reason.message.includes('zws') ||
          e.reason.message.includes('web.telegram.org') ||
          e.reason.message.includes('PromisedWebSockets') ||
          e.reason.message.includes('WebSocket connection timeout') ||
          e.reason.message.includes('WebSocket connection failed')
        )) ||
        (e.reason.toString && (
          e.reason.toString().includes('WebSocket') ||
          e.reason.toString().includes('zws') ||
          e.reason.toString().includes('web.telegram.org')
        ))
      )) {
        // Тихо игнорируем ошибки Telegram WebSocket
        e.preventDefault();
        return;
      }

      if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
        console.log('ChunkLoadError in promise, reloading page...');
        e.preventDefault();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Обработка ошибок консоли (для подавления ошибок WebSocket)
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Подавляем ошибки WebSocket от Telegram
      if (
        message.includes('WebSocket') ||
        message.includes('MTProtoSender') ||
        message.includes('TelegramClient') ||
        message.includes('zws') ||
        message.includes('web.telegram.org') ||
        message.includes('PromisedWebSockets') ||
        message.includes('WebSocket connection failed') ||
        message.includes('WebSocket connection timeout') ||
        message.includes('Using fallback connection') ||
        message.includes('Socket') && message.includes('closed')
      ) {
        // Тихо игнорируем
        return;
      }
      // Вызываем оригинальный console.error для остальных ошибок
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      // Восстанавливаем оригинальный console.error
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}

