import { resolvePromotion } from '@/calculator/pricing/promotion';
import { computeLineTotal } from '@/calculator/pricing/lineTotal';
import { DEFAULT_PRODUCT_WEIGHT } from '@/constants/product';
import { NO_MORNING_BONUS } from '@/constants/promotions';
import { NO_SUBTOTAL, NO_WEIGHT } from '@/constants/report';
import type { CustomerId } from '@/types/customer';
import type { Order } from '@/types/order';
import type { Product, ProductId } from '@/types/product';
import type { Promotion, PromotionCode } from '@/types/promotion';

export interface CustomerAggregate {
    subtotal: number;
    weight: number;
    items: Order[];
    morningBonus: number;
}

export const aggregateOrders = (
    orders: Order[],
    products: Record<ProductId, Product>,
    promotions: Record<PromotionCode, Promotion>,
): Record<CustomerId, CustomerAggregate> => {
    const totals: Record<CustomerId, CustomerAggregate> = {};

    for (const order of orders) {
        const product = products[order.productId];
        const promo = resolvePromotion(order.promoCode, promotions);
        const { lineTotal, morningBonus } = computeLineTotal(order, product, promo);

        if (!totals[order.customerId]) {
            totals[order.customerId] = {
                subtotal: NO_SUBTOTAL,
                weight: NO_WEIGHT,
                items: [],
                morningBonus: NO_MORNING_BONUS,
            };
        }

        totals[order.customerId].subtotal += lineTotal;
        totals[order.customerId].weight += (product?.weight ?? DEFAULT_PRODUCT_WEIGHT) * order.qty;
        totals[order.customerId].items.push(order);
        totals[order.customerId].morningBonus += morningBonus;
    }

    return totals;
};
