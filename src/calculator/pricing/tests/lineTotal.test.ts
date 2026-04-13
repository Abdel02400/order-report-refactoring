import { computeLineTotal } from '@/calculator/pricing/lineTotal';
import { toOrderId } from '@/types/order';
import { toCustomerId } from '@/types/customer';
import { toProductId } from '@/types/product';
import type { Order } from '@/types/order';
import type { Product } from '@/types/product';

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
    id: toOrderId('O1'),
    customerId: toCustomerId('C1'),
    productId: toProductId('P1'),
    qty: 2,
    unitPrice: 10,
    date: '2025-01-15',
    promoCode: '',
    time: '14:00',
    ...overrides,
});

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
    id: toProductId('P1'),
    name: 'Item',
    category: 'Cat',
    price: 10,
    weight: 1,
    taxable: true,
    ...overrides,
});

const NO_PROMO = { discountRate: 0, fixedDiscount: 0 };

describe('computeLineTotal', () => {
    it('uses the product price when available', () => {
        const result = computeLineTotal(makeOrder(), makeProduct({ price: 12 }), NO_PROMO);
        expect(result).toEqual({ lineTotal: 24, morningBonus: 0 });
    });

    it('falls back to the order unit price when the product is unknown', () => {
        const result = computeLineTotal(makeOrder({ unitPrice: 15 }), undefined, NO_PROMO);
        expect(result).toEqual({ lineTotal: 30, morningBonus: 0 });
    });

    it('applies a PERCENTAGE discount', () => {
        const promo = { discountRate: 0.1, fixedDiscount: 0 };
        const result = computeLineTotal(makeOrder(), makeProduct(), promo);
        expect(result.lineTotal).toBeCloseTo(18);
    });

    it('applies a FIXED discount per quantity (legacy quirk)', () => {
        const promo = { discountRate: 0, fixedDiscount: 2 };
        const result = computeLineTotal(makeOrder({ qty: 3 }), makeProduct(), promo);
        expect(result.lineTotal).toBeCloseTo(3 * 10 - 2 * 3);
    });

    it('applies a 3% morning bonus for orders before 10:00', () => {
        const result = computeLineTotal(makeOrder({ time: '09:59' }), makeProduct(), NO_PROMO);
        expect(result.morningBonus).toBeCloseTo(20 * 0.03);
        expect(result.lineTotal).toBeCloseTo(20 - 20 * 0.03);
    });

    it('does not apply morning bonus at 10:00 sharp', () => {
        const result = computeLineTotal(makeOrder({ time: '10:00' }), makeProduct(), NO_PROMO);
        expect(result.morningBonus).toBe(0);
    });
});
