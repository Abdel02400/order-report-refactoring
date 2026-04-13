import { computeLoyaltyDiscount } from '@/calculator/discount/loyalty';
import { computeVolumeDiscount } from '@/calculator/discount/volume';
import { capDiscount } from '@/calculator/discount/cap';
import { computeTax } from '@/calculator/tax/tax';
import { computeShipping } from '@/calculator/shipping/shipping';
import { computeHandling } from '@/calculator/shipping/handling';
import { getCurrencyRate } from '@/calculator/currency/currency';
import { round2 } from '@/utils/number';
import type { Customer } from '@/types/customer';
import type { Product, ProductId } from '@/types/product';
import type { ShippingZonesMap } from '@/parsers/shippingZone';
import type { CustomerReportData } from '@/types/report';
import type { CustomerAggregate } from '@/orchestration/aggregateOrders';

export const buildCustomerReport = (
    customer: Customer,
    aggregate: CustomerAggregate,
    points: number,
    products: Record<ProductId, Product>,
    shippingZones: ShippingZonesMap,
): CustomerReportData => {
    const firstOrderDate = aggregate.items[0]?.date ?? '';
    const volumeDiscount = computeVolumeDiscount(aggregate.subtotal, customer.level, firstOrderDate);
    const loyaltyDiscount = computeLoyaltyDiscount(points);
    const capped = capDiscount(volumeDiscount, loyaltyDiscount);

    const taxable = aggregate.subtotal - capped.total;
    const tax = computeTax(aggregate.items, products, taxable);
    const shipping = computeShipping(aggregate.subtotal, aggregate.weight, customer.shippingZone, shippingZones);
    const handling = computeHandling(aggregate.items.length);

    const currencyRate = getCurrencyRate(customer.currency);
    const total = round2((taxable + tax + shipping + handling) * currencyRate);

    return {
        id: customer.id,
        name: customer.name,
        level: customer.level,
        zone: customer.shippingZone,
        currency: customer.currency,
        subtotal: aggregate.subtotal,
        totalDiscount: capped.total,
        volumeDiscount: capped.volume,
        loyaltyDiscount: capped.loyalty,
        morningBonus: aggregate.morningBonus,
        tax: tax * currencyRate,
        shipping,
        weight: aggregate.weight,
        handling,
        itemCount: aggregate.items.length,
        total,
        loyaltyPoints: Math.floor(points),
    };
};
