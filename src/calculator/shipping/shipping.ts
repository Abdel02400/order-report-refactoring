import type { ShippingZone, ShippingZoneCode } from '@/types/shippingZone';
import type { ShippingZonesMap } from '@/parsers/shippingZone';
import {
    SHIPPING_LIMIT,
    HEAVY_WEIGHT_THRESHOLD,
    MEDIUM_WEIGHT_THRESHOLD,
    MEDIUM_WEIGHT_RATE,
    REMOTE_ZONES,
    REMOTE_ZONE_MULTIPLIER,
    DEFAULT_ZONE_BASE,
    DEFAULT_ZONE_PER_KG,
    FREE_SHIPPING_HEAVY_THRESHOLD,
    FREE_SHIPPING_HEAVY_RATE,
    NO_SHIPPING,
} from '@/constants/shipping';

function computePaidShipping(
    weight: number,
    zone: ShippingZoneCode,
    shippingZones: ShippingZonesMap,
): number {
    const defaultShipZone: ShippingZone = {
        zone,
        base: DEFAULT_ZONE_BASE,
        perKg: DEFAULT_ZONE_PER_KG
    };
    const shipZone = shippingZones[zone] ?? defaultShipZone;
    const baseShip = shipZone.base;

    let ship: number;
    switch (true) {
        case weight > HEAVY_WEIGHT_THRESHOLD:
            ship = baseShip + (weight - HEAVY_WEIGHT_THRESHOLD) * shipZone.perKg;
            break;
        case weight > MEDIUM_WEIGHT_THRESHOLD:
            ship = baseShip + (weight - MEDIUM_WEIGHT_THRESHOLD) * MEDIUM_WEIGHT_RATE;
            break;
        default:
            ship = baseShip;
    }

    if (REMOTE_ZONES.includes(zone)) ship = ship * REMOTE_ZONE_MULTIPLIER;

    return ship;
}

export function computeShipping(
    subtotal: number,
    weight: number,
    zone: ShippingZoneCode,
    shippingZones: ShippingZonesMap,
): number {
    switch (true) {
        case subtotal < SHIPPING_LIMIT:
            return computePaidShipping(weight, zone, shippingZones);
        case weight > FREE_SHIPPING_HEAVY_THRESHOLD:
            return (weight - FREE_SHIPPING_HEAVY_THRESHOLD) * FREE_SHIPPING_HEAVY_RATE;
        default:
            return NO_SHIPPING;
    }
}
