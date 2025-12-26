import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Таро Telegram Bot',
  description: 'Приложение для гадания на картах Таро',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <Script
          id="chunk-error-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Обработка ошибок загрузки чанков
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('ChunkLoadError')) {
                    console.log('ChunkLoadError detected, reloading page...');
                    // Перезагружаем страницу при ошибке загрузки чанка
                    setTimeout(function() {
                      window.location.reload();
                    }, 1000);
                  }
                }, true);
                
                // Обработка unhandledrejection для промисов
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
                    console.log('ChunkLoadError in promise, reloading page...');
                    e.preventDefault();
                    setTimeout(function() {
                      window.location.reload();
                    }, 1000);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
