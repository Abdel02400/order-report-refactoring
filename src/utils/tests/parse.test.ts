import { parseBool, parseEnum } from '@/utils/parse';

const ALLOWED = ['EUR', 'USD', 'GBP'] as const;

describe('parseEnum', () => {
    it('returns the value when it matches an allowed literal', () => {
        expect(parseEnum('USD', ALLOWED, 'EUR')).toBe('USD');
        expect(parseEnum('GBP', ALLOWED, 'EUR')).toBe('GBP');
    });

    it('falls back when the value is not allowed', () => {
        expect(parseEnum('JPY', ALLOWED, 'EUR')).toBe('EUR');
    });

    it('falls back on empty string', () => {
        expect(parseEnum('', ALLOWED, 'EUR')).toBe('EUR');
    });

    it('treats CRLF-polluted values as unknown and falls back', () => {
        expect(parseEnum('USD\r', ALLOWED, 'EUR')).toBe('EUR');
    });
});

describe('parseBool', () => {
    it('returns true for the literal string "true"', () => {
        expect(parseBool('true', false)).toBe(true);
    });

    it('returns false for the literal string "false"', () => {
        expect(parseBool('false', true)).toBe(false);
    });

    it('returns the fallback for any other value', () => {
        expect(parseBool('', false)).toBe(false);
        expect(parseBool('', true)).toBe(true);
        expect(parseBool('YES', false)).toBe(false);
        expect(parseBool('1', true)).toBe(true);
    });

    it('returns the fallback for CRLF-polluted values', () => {
        expect(parseBool('true\r', false)).toBe(false);
        expect(parseBool('false\r', true)).toBe(true);
    });
});
