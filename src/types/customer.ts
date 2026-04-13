import type { ShippingZoneCode } from '@/types/shippingZone';
import { Currency } from '@/types/currency';

export type CustomerId = string & { readonly __brand: 'CustomerId' };
export type CustomerLevel = 'BASIC' | 'PREMIUM';

export interface Customer {
    id: CustomerId;
    name: string;
    level: CustomerLevel;
    shippingZone: ShippingZoneCode;
    currency: Currency;
}
