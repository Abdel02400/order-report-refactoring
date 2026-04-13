import { computeShipping } from '@/calculator/shipping/shipping';
import { SHIPPING_ZONE } from '@/types/shippingZone';
import type { ShippingZonesMap } from '@/parsers/shippingZone';

const ZONES: ShippingZonesMap = {
    ZONE1: { zone: 'ZONE1', base: 5, perKg: 0.5 },
    ZONE2: { zone: 'ZONE2', base: 7.5, perKg: 0.6 },
    ZONE3: { zone: 'ZONE3', base: 10, perKg: 0.8 },
    ZONE4: { zone: 'ZONE4', base: 12.5, perKg: 1 },
};

describe('computeShipping', () => {
    describe('below the free-shipping threshold (< 50)', () => {
        it('applies the base when weight is light (<= 5kg)', () => {
            expect(computeShipping(40, 3, SHIPPING_ZONE.ZONE_1, ZONES)).toBe(5);
        });

        it('applies the medium-weight bracket between 5kg and 10kg', () => {
            expect(computeShipping(40, 8, SHIPPING_ZONE.ZONE_1, ZONES)).toBeCloseTo(5 + (8 - 5) * 0.3);
        });

        it('applies the heavy-weight bracket above 10kg', () => {
            expect(computeShipping(40, 15, SHIPPING_ZONE.ZONE_1, ZONES)).toBeCloseTo(5 + (15 - 10) * 0.5);
        });

        it('multiplies by 1.2 for remote zones (ZONE3 / ZONE4)', () => {
            expect(computeShipping(40, 3, SHIPPING_ZONE.ZONE_3, ZONES)).toBeCloseTo(10 * 1.2);
            expect(computeShipping(40, 3, SHIPPING_ZONE.ZONE_4, ZONES)).toBeCloseTo(12.5 * 1.2);
        });

        it('uses the default zone fallback when the zone is not in the map', () => {
            expect(computeShipping(40, 3, SHIPPING_ZONE.ZONE_1, {})).toBe(5);
        });
    });

    describe('at or above the free-shipping threshold (>= 50)', () => {
        it('returns 0 below the heavy-weight threshold (<= 20kg)', () => {
            expect(computeShipping(100, 10, SHIPPING_ZONE.ZONE_1, ZONES)).toBe(0);
            expect(computeShipping(100, 20, SHIPPING_ZONE.ZONE_1, ZONES)).toBe(0);
        });

        it('charges 0.25 per kg above 20kg', () => {
            expect(computeShipping(100, 30, SHIPPING_ZONE.ZONE_1, ZONES)).toBeCloseTo(10 * 0.25);
        });
    });
});
