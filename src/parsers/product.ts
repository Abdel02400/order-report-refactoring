import { readCsv, type CsvRow } from '@/parsers/csv';
import { CSV_FILE } from '@constants/csv';
import { parseBool } from '@/utils/parse';
import { toProductId, type Product, type ProductId } from '@/types/product';
import { DEFAULT_PRODUCT_WEIGHT } from '@/constants/product';

interface ProductCsvRow extends CsvRow {
    id: string;
    name: string;
    category: string;
    price: string;
    weight: string;
    taxable: string;
}

export const parseProducts = (): Record<ProductId, Product> => {
    const rows = readCsv<ProductCsvRow>(CSV_FILE.PRODUCTS);
    const products: Record<ProductId, Product> = {};

    for (const row of rows) {
        const id = toProductId(row.id);
        const name = row.name;
        const category = row.category;
        const price = parseFloat(row.price);
        const weight = row.weight ? parseFloat(row.weight) : DEFAULT_PRODUCT_WEIGHT;
        const taxable = parseBool(row.taxable, false);

        products[id] = { id, name, category, price, weight, taxable };
    }

    return products;
};
