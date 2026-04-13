import { CUSTOMER_LEVEL } from '@/types/customer';
import { CURRENCY } from '@/types/currency';
import { SHIPPING_ZONE } from '@/types/shippingZone';
import { DEFAULT_CUSTOMER_NAME } from '@/constants/customer';
import type { Customer, CustomerId } from '@/types/customer';

export const resolveCustomer = (
    id: CustomerId,
    customers: Record<CustomerId, Customer>,
): Customer => {
    const existing = customers[id];
    if (existing) return existing;
    return {
        id,
        name: DEFAULT_CUSTOMER_NAME,
        level: CUSTOMER_LEVEL.BASIC,
        shippingZone: SHIPPING_ZONE.ZONE_1,
        currency: CURRENCY.EUR,
    };
};
