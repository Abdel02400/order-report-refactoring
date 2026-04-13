import { getCurrencyRate } from '@/calculator/currency/currency';
import type { Currency } from '@/types/currency';

describe('getCurrencyRate', () => {
    it('returns 1.0 for EUR', () => {
        expect(getCurrencyRate('EUR')).toBe(1.0);
    });

    it('returns 1.1 for USD', () => {
        expect(getCurrencyRate('USD')).toBe(1.1);
    });

    it('returns 0.85 for GBP', () => {
        expect(getCurrencyRate('GBP')).toBe(0.85);
    });

    it('falls back to DEFAULT_CURRENCY_RATE for unknown currencies', () => {
        expect(getCurrencyRate('JPY' as Currency)).toBe(1.0);
        expect(getCurrencyRate('USD\r' as Currency)).toBe(1.0);
    });
});
