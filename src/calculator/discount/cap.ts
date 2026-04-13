import { MAX_DISCOUNT } from '@/constants/discounts';

export interface CappedDiscount {
    volume: number;
    loyalty: number;
    total: number;
}

export function capDiscount(volume: number, loyalty: number): CappedDiscount {
    const rawTotal = volume + loyalty;
    let total = rawTotal;
    let cappedVolume = volume;
    let cappedLoyalty = loyalty;

    if (rawTotal > MAX_DISCOUNT) {
        total = MAX_DISCOUNT;
        const ratio = MAX_DISCOUNT / rawTotal;
        cappedVolume = volume * ratio;
        cappedLoyalty = loyalty * ratio;
    }

    return { volume: cappedVolume, loyalty: cappedLoyalty, total };
}
