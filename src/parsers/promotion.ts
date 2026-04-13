import { readCsv, type CsvRow } from '@/parsers/csv';
import { CSV_FILE } from '@constants/csv';
import { csvFileExists } from '@/utils/csv';
import { parseBool, parseEnum } from '@/utils/parse';
import {
    PROMOTION_TYPE,
    PROMOTION_TYPES,
    toPromotionCode,
    type Promotion,
    type PromotionCode,
} from '@/types/promotion';

interface PromotionCsvRow extends CsvRow {
    code: string;
    type: string;
    value: string;
    active: string;
}

export const parsePromotions = (): Record<PromotionCode, Promotion> => {
    const promotions: Record<PromotionCode, Promotion> = {};

    // Unlike other CSVs, promotions.csv is optional: the legacy script keeps running
    // when the file is missing and simply returns no promotions. We preserve that
    // behavior here, which is why we check explicitly before calling readCsv (which
    // would otherwise throw on a missing file).
    if (!csvFileExists(CSV_FILE.PROMOTIONS)) return promotions;

    const rows = readCsv<PromotionCsvRow>(CSV_FILE.PROMOTIONS);

    for (const row of rows) {
        const code = toPromotionCode(row.code);
        const type = parseEnum(row.type, PROMOTION_TYPES, PROMOTION_TYPE.PERCENTAGE);
        const value = parseFloat(row.value);
        const active = parseBool(row.active, true);

        promotions[code] = { code, type, value, active };
    }

    return promotions;
};
