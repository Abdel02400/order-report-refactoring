/**
 * Returns the keys of an object typed as `keyof T` instead of `string`.
 *
 * Works around the fact that `Object.keys` always returns `string[]`, even
 * when the object is typed as a `Record<SomeBrandedKey, V>`. The cast is
 * isolated here so business code never has to repeat it.
 *
 * @example
 * const map: Record<CustomerId, Customer> = { ... };
 * typedKeys(map); // typed as CustomerId[]
 */
export const typedKeys = <T extends object>(obj: T): (keyof T)[] =>
    Object.keys(obj) as (keyof T)[];
