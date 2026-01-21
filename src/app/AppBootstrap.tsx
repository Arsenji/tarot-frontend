'use client';

import React, { useEffect } from 'react';
import { bootstrapSubscriptionStatus, useSubscriptionStatus } from '@/state/subscriptionStore';

type Props = {
  children: React.ReactNode;
};

let started = false;

export function AppBootstrap({ children }: Props) {
  const { loaded, loading } = useSubscriptionStatus();

  useEffect(() => {
    if (started) return;
    started = true;
    console.log('🚀 AppBootstrap: starting subscription bootstrap');
    bootstrapSubscriptionStatus().catch(() => {});
  }, []);

  useEffect(() => {
    if (loaded) console.log('✅ AppBootstrap: subscription status loaded');
  }, [loaded]);

  if (!loaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-lg font-semibold">Проверяем доступ…</div>
          <div className="text-sm text-gray-300 mt-2">Загрузка статуса подписки</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

