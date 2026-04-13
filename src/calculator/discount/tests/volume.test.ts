import { computeVolumeDiscount } from '@/calculator/discount/volume';
import { CUSTOMER_LEVEL } from '@/types/customer';

const WEEKDAY = '2025-01-15';
const SATURDAY = '2025-01-18';
const SUNDAY = '2025-01-19';

describe('computeVolumeDiscount', () => {
    it('returns 0 below the first tier', () => {
        expect(computeVolumeDiscount(40, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBe(0);
        expect(computeVolumeDiscount(50, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBe(0);
    });

    it('applies 5% for tier 1 (> 50)', () => {
        expect(computeVolumeDiscount(75, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBeCloseTo(3.75);
    });

    it('applies 10% for tier 2 (> 100)', () => {
        expect(computeVolumeDiscount(150, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBeCloseTo(15);
    });

    it('applies 15% for tier 3 (> 500)', () => {
        expect(computeVolumeDiscount(600, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBeCloseTo(90);
    });

    it('applies 20% for PREMIUM tier (> 1000 + PREMIUM)', () => {
        expect(computeVolumeDiscount(1500, CUSTOMER_LEVEL.PREMIUM, WEEKDAY)).toBeCloseTo(300);
    });

    it('keeps tier 3 rate for BASIC customers above 1000', () => {
        expect(computeVolumeDiscount(1500, CUSTOMER_LEVEL.BASIC, WEEKDAY)).toBeCloseTo(225);
    });

    it('multiplies by 1.05 on Saturday', () => {
        expect(computeVolumeDiscount(150, CUSTOMER_LEVEL.BASIC, SATURDAY)).toBeCloseTo(15 * 1.05);
    });

    it('multiplies by 1.05 on Sunday', () => {
        expect(computeVolumeDiscount(150, CUSTOMER_LEVEL.BASIC, SUNDAY)).toBeCloseTo(15 * 1.05);
    });

    it('applies weekend bonus when firstOrderDate is empty (defaults to Sunday)', () => {
        expect(computeVolumeDiscount(150, CUSTOMER_LEVEL.BASIC, '')).toBeCloseTo(15 * 1.05);
    });
});
