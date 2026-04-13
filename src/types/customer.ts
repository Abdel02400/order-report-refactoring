import type { ShippingZoneCode } from '@/types/shippingZone';
import type { Currency } from '@/types/currency';

export type CustomerId = string & { readonly __brand: 'CustomerId' };

export const toCustomerId = (value: string): CustomerId => value as CustomerId;

export const CUSTOMER_LEVEL = {
    BASIC: 'BASIC',
    PREMIUM: 'PREMIUM',
} as const;

export type CustomerLevel = (typeof CUSTOMER_LEVEL)[keyof typeof CUSTOMER_LEVEL];

export const CUSTOMER_LEVELS = Object.values(CUSTOMER_LEVEL) as readonly CustomerLevel[];

export interface Customer {
    id: CustomerId;
    name: string;
    level: CustomerLevel;
    shippingZone: ShippingZoneCode;
    currency: Currency;
}
