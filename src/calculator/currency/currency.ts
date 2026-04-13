import type { Currency } from '@/types/currency';
import { CURRENCY_RATES } from '@/constants/currency';

/**
 * Returns the conversion rate for a given currency.
 *
 * Today this is a thin wrapper over the CURRENCY_RATES lookup table, which
 * makes it look overkill. It is kept on purpose: it exposes a stable domain
 * verb (`getCurrencyRate`) that the rest of the codebase calls, so the
 * current hard-coded table can be swapped later (fetched from an API,
 * cached, logged, dated per historical rate…) without touching any call
 * site. Keeping the abstraction here is cheaper than reintroducing it
 * everywhere once the requirement changes.
 */
export const getCurrencyRate = (currency: Currency): number => CURRENCY_RATES[currency];
