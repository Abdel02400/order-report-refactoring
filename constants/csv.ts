import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'legacy', 'data');

export const CSV_FILES = {
    customers: path.join(DATA_DIR, 'customers.csv'),
    orders: path.join(DATA_DIR, 'orders.csv'),
    products: path.join(DATA_DIR, 'products.csv'),
    shippingZones: path.join(DATA_DIR, 'shipping_zones.csv'),
    promotions: path.join(DATA_DIR, 'promotions.csv'),
} as const;

export type CsvFileKey = keyof typeof CSV_FILES;

export const CSV_FILE = {
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
    PRODUCTS: 'products',
    SHIPPING_ZONES: 'shippingZones',
    PROMOTIONS: 'promotions',
} as const satisfies Record<string, CsvFileKey>;
