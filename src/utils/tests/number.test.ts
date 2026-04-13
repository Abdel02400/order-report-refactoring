import { round2 } from '@/utils/number';

describe('round2', () => {
    it('rounds to 2 decimal places', () => {
        expect(round2(1.234)).toBe(1.23);
        expect(round2(1.235)).toBe(1.24);
        expect(round2(1.2)).toBe(1.2);
    });

    it('handles integers', () => {
        expect(round2(5)).toBe(5);
    });

    it('handles negative numbers', () => {
        expect(round2(-1.23)).toBe(-1.23);
        expect(round2(-5.678)).toBe(-5.68);
    });

    it('handles zero', () => {
        expect(round2(0)).toBe(0);
    });
});
