# `src/types/`

This folder holds the domain types used across the application.

## Purpose

Centralize every business entity shape behind explicit, reusable TypeScript types. Code should never redeclare an entity shape inline — types always live here and are imported where needed.

## File organization

Types are split into **one file per business entity (or shared concept)** rather than grouped in a single `types.ts`:

- [customer.ts](customer.ts) — `Customer`, `CustomerId`, `CustomerLevel`
- [order.ts](order.ts) — `Order`, `OrderId`
- [product.ts](product.ts) — `Product`, `ProductId`
- [shippingZone.ts](shippingZone.ts) — `ShippingZone`, `ShippingZoneCode`, `SHIPPING_ZONE`
- [promotion.ts](promotion.ts) — `Promotion`, `PromotionCode`, `PromotionType`
- [currency.ts](currency.ts) — `Currency` (shared across customers and pricing)

### Why one file per entity

- **Scales with the project.** On a real application, each entity grows its own set of related types (DTOs, enums, narrow variants) over time. A single file would become a dumping ground; entity files stay small and focused.
- **Explicit file names act as documentation.** Reading `import { Customer } from '@/types/customer'` immediately tells you *which entity* is involved and *where* its contract lives — no need to open the file to find out.
- **Clear ownership and change scope.** A change to the customer contract only touches `customer.ts`. Diffs, code review, and git blame all stay meaningful.
- **Easier to evolve.** When an entity needs richer variants (input DTOs, response shapes, derived types), the file is already there to host them.

## Branded IDs

Entities with opaque identifiers expose a **branded ID type** (`CustomerId`, `ProductId`, `PromotionCode`, `OrderId`) rather than a plain `string`:

```ts
export type CustomerId = string & { readonly __brand: 'CustomerId' };
```

At runtime these are still strings, but TypeScript treats them as distinct types. Passing a `ProductId` where a `CustomerId` is expected becomes a compile-time error, which prevents a whole class of silent ID-mixup bugs. Cross-entity references in interfaces (for example `Order.customerId: CustomerId`) also make relationships explicit at the type level.

## Closed-world unions

When an entity has a **finite, business-defined set of valid values**, the value list itself becomes part of the type. The pattern uses a `const` object combined with `typeof` + `keyof` to derive the union automatically:

```ts
export const SHIPPING_ZONE = {
    ZONE_1: 'ZONE1',
    ZONE_2: 'ZONE2',
    ZONE_3: 'ZONE3',
    ZONE_4: 'ZONE4',
} as const;

export type ShippingZoneCode = (typeof SHIPPING_ZONE)[keyof typeof SHIPPING_ZONE];
```

This gives the best of both worlds: a runtime object that can be iterated or referenced (`SHIPPING_ZONE.ZONE_3`), and a strict literal union at compile time (`'ZONE1' | 'ZONE2' | 'ZONE3' | 'ZONE4'`). The same approach applies to other closed enumerations such as `Currency`, `CustomerLevel`, and `PromotionType` whenever the value list is owned by the business and not by external data.

## Personal convention

This layout reflects how I structure types on production projects — explicit file names per entity, one responsibility per file, branded IDs for cross-entity references, closed-world unions for fixed value sets, imported through a path alias (`@/types/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
