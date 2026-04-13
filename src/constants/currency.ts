import type { Currency } from '@/types/currency';

export const DEFAULT_CURRENCY_RATE = 1.0;

export const CURRENCY_RATES: Record<Currency, number> = {
    EUR: 1.0,
    USD: 1.1,
    GBP: 0.85,
};
