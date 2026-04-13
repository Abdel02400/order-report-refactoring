import { CUSTOMER_LEVEL, type CustomerLevel } from '@/types/customer';
import {
    NO_VOLUME_DISCOUNT,
    VOLUME_TIER_1_MIN,
    VOLUME_TIER_1_RATE,
    VOLUME_TIER_2_MIN,
    VOLUME_TIER_2_RATE,
    VOLUME_TIER_3_MIN,
    VOLUME_TIER_3_RATE,
    VOLUME_TIER_PREMIUM_MIN,
    VOLUME_TIER_PREMIUM_RATE,
    WEEKEND_BONUS_MULTIPLIER,
    WEEKEND_DAYS,
} from '@/constants/discounts';
import { DAY_OF_WEEK, type DayOfWeek } from '@/constants/date';

export function computeVolumeDiscount(subtotal: number, level: CustomerLevel, firstOrderDate: string): number {
    let disc: number;

    switch (true) {
        case subtotal > VOLUME_TIER_PREMIUM_MIN && level === CUSTOMER_LEVEL.PREMIUM:
            disc = subtotal * VOLUME_TIER_PREMIUM_RATE;
            break;
        case subtotal > VOLUME_TIER_3_MIN:
            disc = subtotal * VOLUME_TIER_3_RATE;
            break;
        case subtotal > VOLUME_TIER_2_MIN:
            disc = subtotal * VOLUME_TIER_2_RATE;
            break;
        case subtotal > VOLUME_TIER_1_MIN:
            disc = subtotal * VOLUME_TIER_1_RATE;
            break;
        default:
            disc = NO_VOLUME_DISCOUNT;
    }

    const dayOfWeek = (firstOrderDate ? new Date(firstOrderDate).getDay() : DAY_OF_WEEK.SUNDAY) as DayOfWeek;

    if (WEEKEND_DAYS.includes(dayOfWeek)) disc = disc * WEEKEND_BONUS_MULTIPLIER;

    return disc;
}
