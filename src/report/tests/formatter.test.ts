import { formatReport } from '@/report/formatter';
import { toCustomerId } from '@/types/customer';
import type { CustomerReportData, ReportData } from '@/types/report';

const makeCustomer = (overrides: Partial<CustomerReportData> = {}): CustomerReportData => ({
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
    ...overrides,
});

describe('formatReport', () => {
    it('produces the expected structure for a single customer', () => {
        const data: ReportData = {
            customers: [makeCustomer()],
            grandTotal: 113,
            totalTaxCollected: 18,
        };
        const output = formatReport(data);
        expect(output).toContain('Customer: Alice (C001)');
        expect(output).toContain('Level: BASIC | Zone: ZONE1 | Currency: EUR');
        expect(output).toContain('Subtotal: 100.00');
        expect(output).toContain('Shipping (ZONE1, 2.0kg): 5.00');
        expect(output).toContain('Total: 113.00 EUR');
        expect(output).toContain('Loyalty Points: 1');
        expect(output).toContain('Grand Total: 113.00 EUR');
        expect(output).toContain('Total Tax Collected: 18.00 EUR');
    });

    it('shows the Morning bonus line only when positive', () => {
        const withBonus = formatReport({
            customers: [makeCustomer({ morningBonus: 1.5 })],
            grandTotal: 0,
            totalTaxCollected: 0,
        });
        expect(withBonus).toContain('  - Morning bonus: 1.50');

        const withoutBonus = formatReport({
            customers: [makeCustomer({ morningBonus: 0 })],
            grandTotal: 0,
            totalTaxCollected: 0,
        });
        expect(withoutBonus).not.toContain('Morning bonus');
    });

    it('shows the Handling line only when positive', () => {
        const withHandling = formatReport({
            customers: [makeCustomer({ handling: 2.5, itemCount: 15 })],
            grandTotal: 0,
            totalTaxCollected: 0,
        });
        expect(withHandling).toContain('Handling (15 items): 2.50');

        const withoutHandling = formatReport({
            customers: [makeCustomer({ handling: 0 })],
            grandTotal: 0,
            totalTaxCollected: 0,
        });
        expect(withoutHandling).not.toContain('Handling');
    });

    it('separates customers with a blank line', () => {
        const data: ReportData = {
            customers: [
                makeCustomer({ id: toCustomerId('C001') }),
                makeCustomer({ id: toCustomerId('C002'), name: 'Bob' }),
            ],
            grandTotal: 0,
            totalTaxCollected: 0,
        };
        const output = formatReport(data);
        expect(output).toMatch(/Loyalty Points: 1\n\nCustomer: Bob/);
    });

    it('labels Grand Total and Total Tax Collected in EUR', () => {
        const output = formatReport({
            customers: [makeCustomer({ currency: 'USD' })],
            grandTotal: 100,
            totalTaxCollected: 20,
        });
        expect(output).toContain('Grand Total: 100.00 EUR');
        expect(output).toContain('Total Tax Collected: 20.00 EUR');
    });
});
