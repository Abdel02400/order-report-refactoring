import type { Order } from '@/types/order';
import type { Product } from '@/types/product';
import type { ResolvedPromotion } from '@/calculator/pricing/promotion';
import {
    FULL_PRICE_FACTOR,
    MORNING_BONUS_HOUR,
    MORNING_BONUS_RATE,
    NO_MORNING_BONUS,
} from '@/constants/promotions';
import { parseHour } from '@/utils/date';

export interface LineTotalResult {
    lineTotal: number;
    morningBonus: number;
}

export function computeLineTotal(
    order: Order,
    product: Product | undefined,
    promo: ResolvedPromotion,
): LineTotalResult {
    const basePrice = product?.price !== undefined ? product.price : order.unitPrice;
    let lineTotal = order.qty * basePrice * (FULL_PRICE_FACTOR - promo.discountRate) - promo.fixedDiscount * order.qty;
    const hour = parseHour(order.time);
    const morningBonus = hour < MORNING_BONUS_HOUR ? lineTotal * MORNING_BONUS_RATE : NO_MORNING_BONUS;

    lineTotal = lineTotal - morningBonus;

    return { lineTotal, morningBonus };
}
