import { buildReport } from '@/orchestration/buildReport';
import { writeOutput } from '@/orchestration/writeOutput';
import { formatReport } from '@/report/formatter';
import { buildJsonExport } from '@/report/jsonExport';

export const run = (): string => {
    const data = buildReport();
    const text = formatReport(data);
    const json = buildJsonExport(data.customers);

    writeOutput(text, json);

    return text;
};

if (require.main === module) run();
