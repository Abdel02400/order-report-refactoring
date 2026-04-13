# `src/types/`

This folder holds the domain types used across the application.

## Purpose

Centralize every business entity shape behind explicit, reusable TypeScript types. Code should never redeclare an entity shape inline — types always live here and are imported where needed.

## File organization

Types are split into **one file per business entity (or shared concept)** rather than grouped in a single `types.ts`:

- [customer.ts](customer.ts) — `Customer`, `CustomerId`, `toCustomerId`, `CUSTOMER_LEVEL`, `CUSTOMER_LEVELS`, `CustomerLevel`
- [order.ts](order.ts) — `Order`, `OrderId`, `toOrderId`
- [product.ts](product.ts) — `Product`, `ProductId`, `toProductId`
- [shippingZone.ts](shippingZone.ts) — `ShippingZone`, `SHIPPING_ZONE`, `SHIPPING_ZONE_CODES`, `ShippingZoneCode`
- [promotion.ts](promotion.ts) — `Promotion`, `PromotionCode`, `toPromotionCode`, `PROMOTION_TYPE`, `PROMOTION_TYPES`, `PromotionType`
- [currency.ts](currency.ts) — `CURRENCY`, `CURRENCIES`, `Currency`
- [report.ts](report.ts) — `CustomerReportData`, `ReportData`, `CustomerJsonExport` (DTOs consumed by the report layer)

### Why one file per entity

- **Scales with the project.** On a real application, each entity grows its own set of related types (DTOs, enums, narrow variants) over time. A single file would become a dumping ground; entity files stay small and focused.
- **Explicit file names act as documentation.** Reading `import { Customer } from '@/types/customer'` immediately tells you _which entity_ is involved and _where_ its contract lives — no need to open the file to find out.
- **Clear ownership and change scope.** A change to the customer contract only touches `customer.ts`. Diffs, code review, and git blame all stay meaningful.
- **Easier to evolve.** When an entity needs richer variants (input DTOs, response shapes, derived types), the file is already there to host them.

## Branded IDs

Entities with opaque identifiers expose a **branded ID type** (`CustomerId`, `ProductId`, `PromotionCode`, `OrderId`) rather than a plain `string`:

```ts
export type CustomerId = string & { readonly __brand: 'CustomerId' };
```

At runtime these are still strings, but TypeScript treats them as distinct types. Passing a `ProductId` where a `CustomerId` is expected becomes a compile-time error, which prevents a whole class of silent ID-mixup bugs. Cross-entity references in interfaces (for example `Order.customerId: CustomerId`) also make relationships explicit at the type level.

### Factory functions

To avoid scattering `as CustomerId`-style casts across the codebase, each branded type ships a small factory function that performs the cast in a single auditable place:

```ts
export const toCustomerId = (value: string): CustomerId => value as CustomerId;
```

Parsers and any other boundary code call `toCustomerId(row.id)` instead of casting. When runtime validation is needed later (format, length, existence checks), the change happens inside the factory and every call site benefits immediately.

## Closed-world unions

When an entity has a **finite, business-defined set of valid values**, the value list itself becomes part of the type. The pattern uses a `const` object combined with `typeof` + `keyof` to derive the union automatically, and a paired `VALUES` array gives a runtime list for validators like `parseEnum`:

```ts
export const CURRENCY = {
    EUR: 'EUR',
    USD: 'USD',
    GBP: 'GBP',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const CURRENCIES = Object.values(CURRENCY) as readonly Currency[];
```

This gives three things in one place: a runtime namespace (`CURRENCY.EUR`), a strict literal union (`'EUR' | 'USD' | 'GBP'`), and an iterable list (`CURRENCIES`) ready to plug into runtime validators. The same approach is used for `CUSTOMER_LEVEL`, `PROMOTION_TYPE`, and `SHIPPING_ZONE`.

## Personal convention

This layout reflects how I structure types on production projects — explicit file names per entity, one responsibility per file, branded IDs with factory functions for cross-entity references, closed-world unions for fixed value sets, imported through a path alias (`@/types/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
