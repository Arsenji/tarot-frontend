'use client';

import React, { useEffect } from 'react';
import { bootstrapAuth } from '@/state/authStore';
import { bootstrapSubscriptionStatus } from '@/state/subscriptionStore';
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
    bootstrapSubscriptionStatus().catch(() => {});
  }, []);

  useEffect(() => {
    if (!auth.isReady || !auth.token) return;
    bootstrapSubscriptionStatus().catch(() => {});

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

