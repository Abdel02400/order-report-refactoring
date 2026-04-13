import { SHIPPING_ZONE, type ShippingZoneCode } from '@/types/shippingZone';

export const SHIPPING_LIMIT = 50;
export const SHIP = 5.0;
export const HANDLING_FEE = 2.5;

export const HEAVY_WEIGHT_THRESHOLD = 10;
export const MEDIUM_WEIGHT_THRESHOLD = 5;
export const MEDIUM_WEIGHT_RATE = 0.3;

export const REMOTE_ZONES: ShippingZoneCode[] = [SHIPPING_ZONE.ZONE_3, SHIPPING_ZONE.ZONE_4];
export const REMOTE_ZONE_MULTIPLIER = 1.2;

export const DEFAULT_ZONE_BASE = 5.0;
export const DEFAULT_ZONE_PER_KG = 0.5;

export const FREE_SHIPPING_HEAVY_THRESHOLD = 20;
export const FREE_SHIPPING_HEAVY_RATE = 0.25;

export const HANDLING_ITEM_TIER_1 = 10;
export const HANDLING_ITEM_TIER_2 = 20;
