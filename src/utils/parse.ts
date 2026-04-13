/**
 * Validates that a raw string value belongs to a known set of literal values
 * and returns it narrowed to the corresponding union type. If the value is not
 * part of the allowed list, the provided fallback is returned instead.
 *
 * Useful at the I/O boundary (CSV, JSON, env vars…) when raw strings need to
 * be turned into a strict literal union without unsafe `as` casts.
 *
 * @typeParam T - The string literal union to narrow to.
 * @param value - The raw string read from external input.
 * @param allowed - The exhaustive list of accepted values for `T`.
 * @param fallback - The value to use when `value` is not part of `allowed`.
 * @returns The original value typed as `T` if valid, otherwise `fallback`.
 *
 * @example
 * const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
 * type Currency = typeof CURRENCIES[number];
 *
 * const currency = parseEnum(row.currency, CURRENCIES, 'EUR');
 * // currency is typed as Currency, never just `string`.
 */
export const parseEnum = <T extends string>(
    value: string,
    allowed: readonly T[],
    fallback: T,
): T => (allowed.includes(value as T) ? (value as T) : fallback);

/**
 * Parses a raw string value into a boolean using the conventional
 * `'true'` / `'false'` representation. Any other value (empty string,
 * unknown token, missing field…) returns the provided `fallback`.
 *
 * Useful at the I/O boundary (CSV, JSON, env vars…) where boolean fields
 * are encoded as strings and may be missing or inconsistent.
 *
 * @param value - The raw string read from external input.
 * @param fallback - The value to use when `value` is neither `'true'` nor `'false'`.
 * @returns `true` if `value === 'true'`, `false` if `value === 'false'`, otherwise `fallback`.
 *
 * @example
 * const taxable = parseBool(row.taxable, false);
 * // Only the string 'true' yields true; anything else falls back to false.
 *
 * const active = parseBool(row.active, true);
 * // Only the string 'false' yields false; anything else falls back to true.
 */
export const parseBool = (value: string, fallback: boolean): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
};
