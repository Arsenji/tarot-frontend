'use client';

import { useEffect } from 'react';

export function ChunkErrorHandler() {
  useEffect(() => {
    // Обработка ошибок загрузки чанков
    const handleError = (e: ErrorEvent) => {
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
      if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
        console.log('ChunkLoadError in promise, reloading page...');
        e.preventDefault();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}

