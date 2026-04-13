export const CURRENCY = {
    EUR: 'EUR',
    USD: 'USD',
    GBP: 'GBP'
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const CURRENCIES = Object.values(CURRENCY) as readonly Currency[];
