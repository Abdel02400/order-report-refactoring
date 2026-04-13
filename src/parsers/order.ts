import { readCsv, type CsvRow } from '@/parsers/csv';
import { CSV_FILE } from '@constants/csv';
import { toOrderId, type Order } from '@/types/order';
import { toCustomerId } from '@/types/customer';
import { toProductId } from '@/types/product';
import { toPromotionCode } from '@/types/promotion';
import { DEFAULT_ORDER_TIME } from '@/constants/order';

interface OrderCsvRow extends CsvRow {
    id: string;
    customer_id: string;
    product_id: string;
    qty: string;
    unit_price: string;
    date: string;
    promo_code: string;
    time: string;
}

export const parseOrders = (): Order[] => {
    const rows = readCsv<OrderCsvRow>(CSV_FILE.ORDERS);

    return rows.map((row) => ({
        id: toOrderId(row.id),
        customerId: toCustomerId(row.customer_id),
        productId: toProductId(row.product_id),
        qty: parseInt(row.qty),
        unitPrice: parseFloat(row.unit_price),
        date: row.date,
        promoCode: row.promo_code ? toPromotionCode(row.promo_code) : '',
        time: row.time || DEFAULT_ORDER_TIME,
    }));
};
