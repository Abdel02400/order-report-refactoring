import { buildJsonExport } from '@/report/jsonExport';
import { toCustomerId } from '@/types/customer';
import type { CustomerReportData } from '@/types/report';

const makeCustomer = (): CustomerReportData => ({
    id: toCustomerId('C001'),
    name: 'Alice',
    level: 'BASIC',
    zone: 'ZONE1',
    currency: 'EUR',
    subtotal: 100,
    totalDiscount: 10,
    volumeDiscount: 10,
    loyaltyDiscount: 0,
    morningBonus: 0,
    tax: 18,
    shipping: 5,
    weight: 2,
    handling: 0,
    itemCount: 2,
    total: 113,
    loyaltyPoints: 1,
});

describe('buildJsonExport', () => {
    it('maps DTOs to snake_case JSON records', () => {
        const result = buildJsonExport([makeCustomer()]);
        expect(result).toEqual([
            {
                customer_id: 'C001',
                name: 'Alice',
                total: 113,
                currency: 'EUR',
                loyalty_points: 1,
            },
        ]);
    });

    it('returns an empty array when no customers are provided', () => {
        expect(buildJsonExport([])).toEqual([]);
    });
});
