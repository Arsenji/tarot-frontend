'use client';

import React, { useEffect } from 'react';
import { bootstrapAuth } from '@/state/authStore';
import { bootstrapSubscriptionStatus } from '@/state/subscriptionStore';
import { useAuthStatus } from '@/state/authStore';

type Props = {
  children: React.ReactNode;
};

let started = false;

export function AppBootstrap({ children }: Props) {
  const auth = useAuthStatus();

  useEffect(() => {
    if (started) return;
    started = true;
    bootstrapAuth().catch(() => {});
    // Immediately hydrate from localStorage cache (no network needed).
    // If cache is fresh (< 2h), this unlocks the UI instantly.
    bootstrapSubscriptionStatus().catch(() => {});
  }, []);

  useEffect(() => {
    // After auth completes with a token, refresh subscription from server.
    // bootstrapSubscriptionStatus() will make a real network request this time.
    if (!auth.isReady || !auth.token) return;
    bootstrapSubscriptionStatus().catch(() => {});
  }, [auth.isReady, auth.token]);

  return <>{children}</>;
}

