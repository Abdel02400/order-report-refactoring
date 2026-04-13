import * as fs from 'fs';
import { CSV_FILES, type CsvFileKey } from '@constants/csv';
import { csvFileExists } from '@/utils/csv';

export type CsvRow = Record<string, string>;

export const readCsv = <T extends CsvRow = CsvRow>(fileKey: CsvFileKey): T[] => {
    if (!csvFileExists(fileKey)) throw new Error(`CSV file not found: "${fileKey}" (${CSV_FILES[fileKey]})`);

    const filePath = CSV_FILES[fileKey];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    // Throw on empty file or header-only file. The legacy silently returned an empty
    // result in both cases; we prefer an explicit error so missing data is never ignored.
    if (lines.length <= 1) throw new Error(`CSV file is empty: "${fileKey}" (${filePath})`);

    const headers = lines[0].trim().split(',');
    const rows: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {} as T;

        headers.forEach((header, index) => ((row as CsvRow)[header] = values[index] ?? ''));
        rows.push(row);
    }

    return rows;
};
