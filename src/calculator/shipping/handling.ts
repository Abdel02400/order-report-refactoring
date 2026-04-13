import { HANDLING_FEE, HANDLING_ITEM_TIER_1, HANDLING_ITEM_TIER_2, HANDLING_TIER_2_MULTIPLIER, NO_HANDLING } from '@/constants/shipping';

export function computeHandling(itemCount: number): number {
    switch (true) {
        case itemCount > HANDLING_ITEM_TIER_2:
            return HANDLING_FEE * HANDLING_TIER_2_MULTIPLIER;
        case itemCount > HANDLING_ITEM_TIER_1:
            return HANDLING_FEE;
        default:
            return NO_HANDLING;
    }
}
