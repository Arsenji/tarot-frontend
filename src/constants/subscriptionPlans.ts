export type SubscriptionPlanId = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionPlan = {
  /** IMPORTANT: do not change ids without coordinating with backend/payment mapping */
  id: SubscriptionPlanId;
  title: string;
  description: string;
  /** Display-only (UI). Do not use for subscription logic. */
  durationDays: number;
  /** Display-only (UI). Currency is RUB (₽). */
  priceRub: number;
};

/**
 * UI-only subscription plans.
 * - Backend/payment logic is intentionally NOT changed here.
 * - Keep formatting in UI via Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', ... }).
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    title: 'Недельная подписка',
    description: 'Недельная подписка',
    durationDays: 7,
    priceRub: 299.0,
  },
  {
    id: 'monthly',
    title: 'Месячная подписка',
    description: 'Месячная подписка',
    durationDays: 30,
    priceRub: 699.0,
  },
  {
    id: 'quarterly',
    title: 'Квартальная подписка',
    description: 'Квартальная подписка',
    durationDays: 90,
    priceRub: 1999.0,
  },
  {
    id: 'yearly',
    title: 'Годовая подписка',
    description: 'Годовая подписка',
    durationDays: 365,
    priceRub: 10990.0,
  },
];

