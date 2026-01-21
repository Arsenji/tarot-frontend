'use client';

import React, { useEffect } from 'react';
import { bootstrapAuth } from '@/state/authStore';
import { bootstrapSubscriptionStatus } from '@/state/subscriptionStore';

type Props = {
  children: React.ReactNode;
};

let started = false;

export function AppBootstrap({ children }: Props) {
  useEffect(() => {
    if (started) return;
    started = true;
    // Step 1: auth bootstrap
    bootstrapAuth()
      .catch(() => {})
      .finally(() => {
        // Step 2: tarot bootstrap (internally guarded by token existence)
        bootstrapSubscriptionStatus().catch(() => {});
      });
  }, []);

  return <>{children}</>;
}

