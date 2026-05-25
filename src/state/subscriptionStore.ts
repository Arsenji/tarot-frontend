'use client';

/** @deprecated Import from @/state/tokenStore instead */
export {
  applyWalletInfo as applySubscriptionInfo,
  bootstrapWalletStatus as bootstrapSubscriptionStatus,
  getWalletSnapshot as getSubscriptionSnapshot,
  subscribeWallet as subscribeSubscription,
  useWalletStatus as useSubscriptionStatus,
  getTarotAvailability,
  applyCooldownOverride,
  __resetTokenStoreForTests as __resetSubscriptionStoreForTests,
  type WalletInfo as SubscriptionInfo,
  type TarotType,
  type TarotAvailability,
  type CooldownEndsAt,
  type TokenState as SubscriptionState,
} from '@/state/tokenStore';
