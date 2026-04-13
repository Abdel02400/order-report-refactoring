import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { EXPECTED_REPORT } from '@constants/paths';

describe('Legacy vs refactored output (Golden Master)', () => {
    beforeAll(() => {
        const output = execSync('pnpm legacy', { encoding: 'utf-8' });
        fs.mkdirSync(path.dirname(EXPECTED_REPORT), { recursive: true });
        fs.writeFileSync(EXPECTED_REPORT, output);
    });

    afterAll(() => {
        fs.rmSync(path.dirname(EXPECTED_REPORT), { recursive: true, force: true });
    });

    it('legacy script runs without error', () => {
        expect(fs.existsSync(EXPECTED_REPORT)).toBe(true);
    });
});
