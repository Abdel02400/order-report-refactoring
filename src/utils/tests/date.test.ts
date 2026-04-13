import { parseHour } from '@/utils/date';

describe('parseHour', () => {
    it('extracts the hour from HH:MM format', () => {
        expect(parseHour('14:30')).toBe(14);
        expect(parseHour('09:15')).toBe(9);
        expect(parseHour('00:00')).toBe(0);
        expect(parseHour('23:59')).toBe(23);
    });

    it('tolerates trailing \\r from CRLF-polluted CSV values', () => {
        expect(parseHour('09:15\r')).toBe(9);
    });
});
