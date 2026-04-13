import { computeTax } from '@/calculator/tax/tax';
import { toOrderId } from '@/types/order';
import { toCustomerId } from '@/types/customer';
import { toProductId } from '@/types/product';
import type { Order } from '@/types/order';
import type { Product, ProductId } from '@/types/product';

const makeOrder = (productId: string, qty: number, unitPrice: number): Order => ({
    id: toOrderId('O1'),
    customerId: toCustomerId('C1'),
    productId: toProductId(productId),
    qty,
    unitPrice,
    date: '2025-01-15',
    promoCode: '',
    time: '12:00',
});

const makeProduct = (id: string, price: number, taxable: boolean): Product => ({
    id: toProductId(id),
    name: 'Item',
    category: 'Cat',
    price,
    weight: 1,
    taxable,
});

describe('computeTax', () => {
    it('applies 20% on the full taxable amount when all products are taxable', () => {
        const products: Record<ProductId, Product> = {
            [toProductId('P1')]: makeProduct('P1', 100, true),
        };
        const items = [makeOrder('P1', 2, 100)];
        expect(computeTax(items, products, 200)).toBe(40);
    });

    it('rounds to 2 decimal places', () => {
        const products: Record<ProductId, Product> = {
            [toProductId('P1')]: makeProduct('P1', 10, true),
        };
        const items = [makeOrder('P1', 1, 10)];
        expect(computeTax(items, products, 33.33)).toBe(6.67);
    });

    it('applies tax only to taxable items when some are not taxable', () => {
        const products: Record<ProductId, Product> = {
            [toProductId('P1')]: makeProduct('P1', 100, true),
            [toProductId('P2')]: makeProduct('P2', 50, false),
        };
        const items = [makeOrder('P1', 1, 100), makeOrder('P2', 2, 50)];
        expect(computeTax(items, products, 999)).toBe(20);
    });

    it('returns 0 when no taxable items exist in a mixed list with none taxable', () => {
        const products: Record<ProductId, Product> = {
            [toProductId('P1')]: makeProduct('P1', 50, true),
            [toProductId('P2')]: makeProduct('P2', 50, false),
        };
        const items = [makeOrder('P2', 1, 50)];
        expect(computeTax(items, products, 50)).toBe(0);
    });
});
