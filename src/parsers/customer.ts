import { readCsv, type CsvRow } from '@/parsers/csv';
import { CSV_FILE } from '@constants/csv';
import { parseEnum } from '@/utils/parse';
import {
    CUSTOMER_LEVEL,
    CUSTOMER_LEVELS,
    toCustomerId,
    type Customer,
    type CustomerId,
} from '@/types/customer';
import { CURRENCY, CURRENCIES } from '@/types/currency';
import { SHIPPING_ZONE, SHIPPING_ZONE_CODES } from '@/types/shippingZone';

interface CustomerCsvRow extends CsvRow {
    id: string;
    name: string;
    level: string;
    shipping_zone: string;
    currency: string;
}

export const parseCustomers = (): Record<CustomerId, Customer> => {
    const rows = readCsv<CustomerCsvRow>(CSV_FILE.CUSTOMERS);
    const customers: Record<CustomerId, Customer> = {};

    for (const row of rows) {
        const id = toCustomerId(row.id);
        const name = row.name;
        const level = parseEnum(row.level || CUSTOMER_LEVEL.BASIC, CUSTOMER_LEVELS, CUSTOMER_LEVEL.BASIC);
        const shippingZone = parseEnum(row.shipping_zone || SHIPPING_ZONE.ZONE_1, SHIPPING_ZONE_CODES, SHIPPING_ZONE.ZONE_1);
        const currency = parseEnum(row.currency || CURRENCY.EUR, CURRENCIES, CURRENCY.EUR);

        customers[id] = { id, name, level, shippingZone, currency };
    }

    return customers;
};
