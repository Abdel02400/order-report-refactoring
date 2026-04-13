/**
 * Extracts the hour component from a `HH:MM` time string.
 *
 * @param time - A time string formatted as `HH:MM` (for example `'09:15'`).
 * @returns The hour as an integer between 0 and 23.
 *
 * @example
 * parseHour('14:30'); // 14
 * parseHour('09:05'); // 9
 */
export const parseHour = (time: string): number => parseInt(time.split(':')[0]);
