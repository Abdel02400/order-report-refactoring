import * as fs from 'fs';
import { OUTPUT_JSON } from '@constants/paths';
import type { CustomerJsonExport } from '@/types/report';

export const writeOutput = (reportText: string, jsonData: CustomerJsonExport[]): void => {
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2));
    console.info(reportText);
};
