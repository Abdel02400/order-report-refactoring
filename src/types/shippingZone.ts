export const SHIPPING_ZONE = {
    ZONE_1: 'ZONE1',
    ZONE_2: 'ZONE2',
    ZONE_3: 'ZONE3',
    ZONE_4: 'ZONE4',
} as const;

export type ShippingZoneCode = (typeof SHIPPING_ZONE)[keyof typeof SHIPPING_ZONE];

export const SHIPPING_ZONE_CODES = Object.values(SHIPPING_ZONE) as readonly ShippingZoneCode[];

export interface ShippingZone {
    zone: ShippingZoneCode;
    base: number;
    perKg: number;
}
