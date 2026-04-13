import { computeLoyaltyDiscount, computeLoyaltyPoints } from '@/calculator/discount/loyalty';
import { toCustomerId } from '@/types/customer';
import { toOrderId } from '@/types/order';
import { toProductId } from '@/types/product';
import type { Order } from '@/types/order';

const makeOrder = (customerId: string, qty: number, unitPrice: number): Order => ({
    id: toOrderId('O1'),
    customerId: toCustomerId(customerId),
    productId: toProductId('P1'),
    qty,
    unitPrice,
    date: '2025-01-15',
    promoCode: '',
    time: '12:00',
});

describe('computeLoyaltyPoints', () => {
    it('accumulates qty * unitPrice * ratio per customer', () => {
        const orders = [makeOrder('C001', 2, 50), makeOrder('C001', 3, 10)];
        const points = computeLoyaltyPoints(orders);
        expect(points[toCustomerId('C001')]).toBeCloseTo((2 * 50 + 3 * 10) * 0.01);
    });

    it('keeps points separate per customer', () => {
        const orders = [makeOrder('C001', 1, 100), makeOrder('C002', 1, 200)];
        const points = computeLoyaltyPoints(orders);
        expect(points[toCustomerId('C001')]).toBeCloseTo(1);
        expect(points[toCustomerId('C002')]).toBeCloseTo(2);
    });

    it('returns an empty map when no orders', () => {
        expect(computeLoyaltyPoints([])).toEqual({});
    });
});

describe('computeLoyaltyDiscount', () => {
    it('returns 0 below tier 1 (100 points)', () => {
        expect(computeLoyaltyDiscount(50)).toBe(0);
        expect(computeLoyaltyDiscount(100)).toBe(0);
    });

    it('applies 10% capped at 50 for tier 1', () => {
        expect(computeLoyaltyDiscount(200)).toBe(20);
        expect(computeLoyaltyDiscount(400)).toBe(40);
        expect(computeLoyaltyDiscount(499)).toBeCloseTo(49.9);
    });

    it('applies 15% capped at 100 for tier 2 (> 500)', () => {
        expect(computeLoyaltyDiscount(600)).toBe(90);
        expect(computeLoyaltyDiscount(1000)).toBe(100);
        expect(computeLoyaltyDiscount(5000)).toBe(100);
    });
});
