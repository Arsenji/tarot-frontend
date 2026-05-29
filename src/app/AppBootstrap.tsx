'use client';

import React, { useEffect } from 'react';
import { bootstrapAuth } from '@/state/authStore';
import { bootstrapWalletStatus } from '@/state/tokenStore';
import { useAuthStatus } from '@/state/authStore';
import { initAnalytics, identifyUser, trackAppOpened } from '@/utils/analytics';

type Props = {
  children: React.ReactNode;
};

let started = false;

export function AppBootstrap({ children }: Props) {
  const auth = useAuthStatus();

  useEffect(() => {
    if (started) return;
    started = true;

    initAnalytics();
    trackAppOpened();

    bootstrapAuth().catch(() => {});
    bootstrapWalletStatus().catch(() => {});
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        bootstrapWalletStatus({ force: true }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (!auth.isReady || !auth.token) return;
    bootstrapWalletStatus().catch(() => {});

    // Identify user for PostHog after auth resolves
    try {
      const telegramId = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (telegramId) {
        identifyUser(telegramId);
      }
    } catch {
      // outside Telegram
    }
  }, [auth.isReady, auth.token]);

  return <>{children}</>;
}

