import type { Order } from '@/types/order';
import type { CustomerId } from '@/types/customer';
import { LOYALTY_RATIO } from '@/constants/loyalty';
import {
    NO_LOYALTY_DISCOUNT,
    LOYALTY_TIER_1_MIN_POINTS,
    LOYALTY_TIER_1_RATE,
    LOYALTY_TIER_1_CAP,
    LOYALTY_TIER_2_MIN_POINTS,
    LOYALTY_TIER_2_RATE,
    LOYALTY_TIER_2_CAP,
} from '@/constants/discounts';

export function computeLoyaltyPoints(orders: Order[]): Record<CustomerId, number> {
    const points: Record<CustomerId, number> = {};
    for (const order of orders) {
        const cid = order.customerId;
        if (!points[cid]) points[cid] = 0;
        points[cid] += order.qty * order.unitPrice * LOYALTY_RATIO;
    }
    return points;
}

export function computeLoyaltyDiscount(points: number): number {
    switch (true) {
        case points > LOYALTY_TIER_2_MIN_POINTS:
            return Math.min(points * LOYALTY_TIER_2_RATE, LOYALTY_TIER_2_CAP);
        case points > LOYALTY_TIER_1_MIN_POINTS:
            return Math.min(points * LOYALTY_TIER_1_RATE, LOYALTY_TIER_1_CAP);
        default:
            return NO_LOYALTY_DISCOUNT;
    }
}
