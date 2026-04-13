import { readCsv, type CsvRow } from '@/parsers/csv';
import { CSV_FILE } from '@constants/csv';
import { parseEnum } from '@/utils/parse';
import { SHIPPING_ZONE, SHIPPING_ZONE_CODES, type ShippingZone, type ShippingZoneCode } from '@/types/shippingZone';
import { DEFAULT_ZONE_PER_KG } from '@/constants/shipping';

interface ShippingZoneCsvRow extends CsvRow {
    zone: string;
    base: string;
    per_kg: string;
}

export type ShippingZonesMap = Partial<Record<ShippingZoneCode, ShippingZone>>;

export const parseShippingZones = (): ShippingZonesMap => {
    const rows = readCsv<ShippingZoneCsvRow>(CSV_FILE.SHIPPING_ZONES);
    const zones: ShippingZonesMap = {};

    for (const row of rows) {
        const zone = parseEnum(row.zone, SHIPPING_ZONE_CODES, SHIPPING_ZONE.ZONE_1);
        const base = parseFloat(row.base);
        const perKg = row.per_kg ? parseFloat(row.per_kg) : DEFAULT_ZONE_PER_KG;

        zones[zone] = { zone, base, perKg };
    }

    return zones;
};
