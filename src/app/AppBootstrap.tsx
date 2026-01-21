'use client';

import React, { useEffect } from 'react';
import { bootstrapAuth } from '@/state/authStore';
import { bootstrapSubscriptionStatus } from '@/state/subscriptionStore';
import { useAuthStatus } from '@/state/authStore';
import { useSubscriptionStatus } from '@/state/subscriptionStore';

type Props = {
  children: React.ReactNode;
};

let started = false;

export function AppBootstrap({ children }: Props) {
  const auth = useAuthStatus();
  const subscription = useSubscriptionStatus();

  useEffect(() => {
    if (started) return;
    started = true;
    // Step 1: AuthBootstrap (only auth)
    bootstrapAuth().catch(() => {});
  }, []);

  useEffect(() => {
    // Step 2: Subscription bootstrap (ONLY after auth ready + token exists)
    if (!auth.isReady) return;
    if (!auth.token) return;
    if (subscription.isLoaded || subscription.loaded) return;

    bootstrapSubscriptionStatus().catch(() => {});
  }, [auth.isReady, auth.token, subscription.isLoaded, subscription.loaded]);

  return <>{children}</>;
}

