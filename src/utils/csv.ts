import * as fs from 'fs';
import { CSV_FILES, type CsvFileKey } from '@constants/csv';

export function csvFileExists(fileKey: CsvFileKey): boolean {
    return fs.existsSync(CSV_FILES[fileKey]);
}
