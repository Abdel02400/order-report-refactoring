import type { CustomerJsonExport, CustomerReportData } from '@/types/report';

export const buildJsonExport = (customers: CustomerReportData[]): CustomerJsonExport[] =>
    customers.map((c) => ({
        customer_id: c.id,
        name: c.name,
        total: c.total,
        currency: c.currency,
        loyalty_points: c.loyaltyPoints,
    }));
