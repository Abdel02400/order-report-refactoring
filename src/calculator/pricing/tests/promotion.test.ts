import { resolvePromotion } from '@/calculator/pricing/promotion';
import { toPromotionCode } from '@/types/promotion';
import type { Promotion, PromotionCode } from '@/types/promotion';

const percentage = (value: number): Promotion => ({
    code: toPromotionCode('P10'),
    type: 'PERCENTAGE',
    value,
    active: true,
});

const fixed = (value: number): Promotion => ({
    code: toPromotionCode('F20'),
    type: 'FIXED',
    value,
    active: true,
});

describe('resolvePromotion', () => {
    it('returns zero discount when code is empty', () => {
        expect(resolvePromotion('', {})).toEqual({ discountRate: 0, fixedDiscount: 0 });
    });

    it('returns zero discount when code is unknown', () => {
        const code = toPromotionCode('UNKNOWN');
        expect(resolvePromotion(code, {})).toEqual({ discountRate: 0, fixedDiscount: 0 });
    });

    it('returns zero discount when promotion is inactive', () => {
        const code = toPromotionCode('P10');
        const promotions: Record<PromotionCode, Promotion> = { [code]: { ...percentage(10), active: false } };
        expect(resolvePromotion(code, promotions)).toEqual({ discountRate: 0, fixedDiscount: 0 });
    });

    it('applies PERCENTAGE value / 100 to discountRate', () => {
        const code = toPromotionCode('P10');
        const promotions: Record<PromotionCode, Promotion> = { [code]: percentage(10) };
        expect(resolvePromotion(code, promotions)).toEqual({ discountRate: 0.1, fixedDiscount: 0 });
    });

    it('applies FIXED value to fixedDiscount', () => {
        const code = toPromotionCode('F20');
        const promotions: Record<PromotionCode, Promotion> = { [code]: fixed(20) };
        expect(resolvePromotion(code, promotions)).toEqual({ discountRate: 0, fixedDiscount: 20 });
    });
});
