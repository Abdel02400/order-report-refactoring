import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { EXPECTED_REPORT } from '@constants/paths';

const normalize = (s: string) => s.replace(/\r\n/g, '\n');

describe('Legacy vs refactored output (Golden Master)', () => {
    beforeAll(() => {
        const output = execSync('pnpm --silent legacy', { encoding: 'utf-8' });
        fs.mkdirSync(path.dirname(EXPECTED_REPORT), { recursive: true });
        fs.writeFileSync(EXPECTED_REPORT, output);
    });

    afterAll(() => {
        fs.rmSync(path.dirname(EXPECTED_REPORT), { recursive: true, force: true });
    });

    it('refactored output matches expected/report.txt', () => {
        const actual = execSync('pnpm --silent start', { encoding: 'utf-8' });
        const expected = fs.readFileSync(EXPECTED_REPORT, 'utf-8');

        try {
            expect(normalize(actual)).toBe(normalize(expected));
            console.info('✅ IDENTIQUES → Test PASSE');
        } catch (err) {
            console.error('❌ DIFFERENTES → Test FAIL');
            throw err;
        }
    }, 30_000);
});
