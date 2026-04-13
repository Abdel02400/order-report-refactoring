import { PROMOTION_TYPE, type Promotion, type PromotionCode } from '@/types/promotion';
import { NO_DISCOUNT_RATE, NO_FIXED_DISCOUNT, PERCENT_BASE } from '@/constants/promotions';

export interface ResolvedPromotion {
    discountRate: number;
    fixedDiscount: number;
}

export function resolvePromotion(code: PromotionCode | '', promotions: Record<PromotionCode, Promotion>): ResolvedPromotion {
    let discountRate = NO_DISCOUNT_RATE;
    let fixedDiscount = NO_FIXED_DISCOUNT;

    if (!code) return { discountRate, fixedDiscount };

    const promo = promotions[code];
    if (!promo || !promo.active) return { discountRate, fixedDiscount };

    switch (promo.type) {
        case PROMOTION_TYPE.PERCENTAGE:
            discountRate = promo.value / PERCENT_BASE;
            break;
        case PROMOTION_TYPE.FIXED:
            fixedDiscount = promo.value;
            break;
    }

    return { discountRate, fixedDiscount };
}
