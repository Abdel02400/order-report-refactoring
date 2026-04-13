import { computeHandling } from '@/calculator/shipping/handling';

describe('computeHandling', () => {
    it('returns 0 for small orders (<= 10 items)', () => {
        expect(computeHandling(5)).toBe(0);
        expect(computeHandling(10)).toBe(0);
    });

    it('returns the handling fee for medium orders (> 10 and <= 20 items)', () => {
        expect(computeHandling(11)).toBe(2.5);
        expect(computeHandling(20)).toBe(2.5);
    });

    it('doubles the handling fee for very large orders (> 20 items)', () => {
        expect(computeHandling(21)).toBe(5);
        expect(computeHandling(100)).toBe(5);
    });
});
