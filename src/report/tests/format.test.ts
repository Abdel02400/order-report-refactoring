import { money, weight } from '@/report/format';

describe('money', () => {
    it('formats with 2 decimal places', () => {
        expect(money(12.3)).toBe('12.30');
        expect(money(12)).toBe('12.00');
        expect(money(12.345)).toBe('12.35');
    });

    it('formats zero', () => {
        expect(money(0)).toBe('0.00');
    });
});

describe('weight', () => {
    it('formats with 1 decimal place', () => {
        expect(weight(3)).toBe('3.0');
        expect(weight(3.25)).toBe('3.3');
        expect(weight(0)).toBe('0.0');
    });
});
