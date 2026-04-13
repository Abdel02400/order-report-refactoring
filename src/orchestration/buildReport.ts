import { parseCustomers } from '@/parsers/customer';
import { parseOrders } from '@/parsers/order';
import { parseProducts } from '@/parsers/product';
import { parseShippingZones } from '@/parsers/shippingZone';
import { parsePromotions } from '@/parsers/promotion';
import { computeLoyaltyPoints } from '@/calculator/discount/loyalty';
import { aggregateOrders } from '@/orchestration/aggregateOrders';
import { resolveCustomer } from '@/orchestration/resolveCustomer';
import { buildCustomerReport } from '@/orchestration/buildCustomerReport';
import { typedKeys } from '@/utils/object';
import { NO_GRAND_TOTAL, NO_TAX_COLLECTED } from '@/constants/report';
import { NO_LOYALTY_POINTS } from '@/constants/loyalty';
import type { ReportData } from '@/types/report';

export const buildReport = (): ReportData => {
    const customers = parseCustomers();
    const orders = parseOrders();
    const products = parseProducts();
    const shippingZones = parseShippingZones();
    const promotions = parsePromotions();

    const aggregates = aggregateOrders(orders, products, promotions);
    const loyaltyPoints = computeLoyaltyPoints(orders);
    const sortedIds = typedKeys(aggregates).sort();

    const customerReports = sortedIds.map((cid) =>
        buildCustomerReport(
            resolveCustomer(cid, customers),
            aggregates[cid],
            loyaltyPoints[cid] ?? NO_LOYALTY_POINTS,
            products,
            shippingZones,
        ),
    );

    const grandTotal = customerReports.reduce((sum, r) => sum + r.total, NO_GRAND_TOTAL);
    const totalTaxCollected = customerReports.reduce((sum, r) => sum + r.tax, NO_TAX_COLLECTED);

    return { customers: customerReports, grandTotal, totalTaxCollected };
};
