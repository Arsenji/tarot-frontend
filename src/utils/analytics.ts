import posthog from 'posthog-js';
import type { TokenPackageId } from '@/constants/tokenPackages';

const POSTHOG_KEY = 'phc_pA7Aai2zies44X8G3ebVUTQii7DmCRxt26Cww33HPsN3';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    loaded: () => {
      console.log('PostHog: initialized');
    },
  });
  initialized = true;
}

export function identifyUser(userId: string | number): void {
  if (typeof window === 'undefined') return;
  posthog.identify(String(userId));
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

export function trackAppOpened(): void {
  trackEvent('app_opened');
}

export function trackTarotStarted(type: 'one_card' | 'yes_no' | 'three_cards'): void {
  trackEvent('tarot_started', { type });
}

export function trackTarotCompleted(type: 'one_card' | 'yes_no' | 'three_cards', success: boolean): void {
  trackEvent('tarot_completed', { type, success });
}

export function trackTokensShopOpened(): void {
  trackEvent('tokens_shop_opened');
}

export function trackTokenPackageSelected(packageId: TokenPackageId): void {
  trackEvent('token_package_selected', { package: packageId });
}

export function trackTokensSpent(amount: number, spreadType: 'yes_no' | 'three_cards'): void {
  trackEvent('tokens_spent', { amount, spread_type: spreadType });
}

/** @deprecated use trackTokensShopOpened */
export function trackSubscriptionClicked(): void {
  trackTokensShopOpened();
}
