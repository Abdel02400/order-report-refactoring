import * as path from 'path';

export const EXPECTED_REPORT = path.join(process.cwd(), 'legacy', 'expected', 'report.txt');

const DATA_DIR = path.join(process.cwd(), 'legacy', 'data');

export const CUSTOMERS_CSV = path.join(DATA_DIR, 'customers.csv');
export const ORDERS_CSV = path.join(DATA_DIR, 'orders.csv');
export const PRODUCTS_CSV = path.join(DATA_DIR, 'products.csv');
export const SHIPPING_ZONES_CSV = path.join(DATA_DIR, 'shipping_zones.csv');
export const PROMOTIONS_CSV = path.join(DATA_DIR, 'promotions.csv');
