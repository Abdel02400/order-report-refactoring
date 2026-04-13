import { capDiscount } from '@/calculator/discount/cap';

describe('capDiscount', () => {
    it('leaves both discounts unchanged below the cap', () => {
        const result = capDiscount(50, 30);
        expect(result).toEqual({ volume: 50, loyalty: 30, total: 80 });
    });

    it('leaves both unchanged when exactly at the cap', () => {
        const result = capDiscount(150, 50);
        expect(result).toEqual({ volume: 150, loyalty: 50, total: 200 });
    });

    it('scales both proportionally above the cap', () => {
        const result = capDiscount(300, 100);
        expect(result.total).toBe(200);
        expect(result.volume).toBeCloseTo(150);
        expect(result.loyalty).toBeCloseTo(50);
    });

    it('preserves the ratio between volume and loyalty when capping', () => {
        const result = capDiscount(600, 0);
        expect(result.volume).toBe(200);
        expect(result.loyalty).toBe(0);
    });
});
