import type { Order } from '@/types/order';
import type { Product, ProductId } from '@/types/product';
import { NO_TAX, TAX } from '@/constants/tax';
import { round2 } from '@/utils/number';

export function computeTax(
    items: Order[],
    products: Record<ProductId, Product>,
    taxableAmount: number,
): number {
    let allTaxable = true;

    for (const item of items) {
        const product = products[item.productId];
        if (product && product.taxable === false) {
            allTaxable = false;
            break;
        }
    }

    if (allTaxable) return round2(taxableAmount * TAX);

    let tax = NO_TAX;
    for (const item of items) {
        const product = products[item.productId];
        if (product && product.taxable !== false) {
            const itemTotal = item.qty * (product.price || item.unitPrice);
            tax += itemTotal * TAX;
        }
    }

    return round2(tax);
}
