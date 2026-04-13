# `src/parsers/`

This folder holds the CSV parsers that turn raw data files into typed domain entities.

## Purpose

Isolate every piece of I/O and string-to-value conversion behind dedicated functions. The rest of the codebase never reads a CSV or parses a number by itself — it calls a parser and receives fully-typed objects (`Customer`, `Order`, `Product`, etc.), ready to be consumed by the domain layer.

## File organization

Parsers are split into **one file per entity**, plus a shared low-level helper:

- [csv.ts](csv.ts) — generic `readCsv<T>()` helper that turns a CSV file into a typed array of rows, throwing on missing or empty files
- [customer.ts](customer.ts) — `parseCustomers()`
- [order.ts](order.ts) — `parseOrders()`
- [product.ts](product.ts) — `parseProducts()`
- [shippingZone.ts](shippingZone.ts) — `parseShippingZones()`
- [promotion.ts](promotion.ts) — `parsePromotions()` (tolerates a missing file; comment explains the legacy rule)

### Why one file per entity

- **Scales with the project.** On a real application, each entity's parser evolves its own validation, defaults, and edge cases over time. A single parser file would become a dumping ground; per-entity files stay small and focused.
- **Explicit file names act as documentation.** Reading `import { parseCustomers } from '@/parsers/customer'` immediately tells you _which entity_ is being parsed and _where_ its parsing rules live — no need to open the file to find out.
- **Clear ownership and change scope.** A change to how customers are parsed only touches `customer.ts`. Diffs, code review, and git blame all stay meaningful.
- **Easier to evolve.** When an entity needs richer parsing (validation, schema checks, versioning), the file is already there to host it.

## Design notes

- **One generic CSV reader.** All entity parsers share `readCsv<T>()` instead of reimplementing line splitting, header handling, and field extraction. The legacy code duplicated that logic five times — the refactored version does it once.
- **Typed row interfaces.** Each parser declares a `*CsvRow` interface listing the raw CSV columns it expects (for example `CustomerCsvRow`, `OrderCsvRow`). Passing that shape to `readCsv<T>` turns a typo like `row.shiping_zone` into a compile-time error instead of a silent `undefined` at runtime.
- **Typed file keys, not raw strings.** Parsers never embed string literals like `'customers'` — they reference `CSV_FILE.CUSTOMERS` (see [`constants/csv.ts`](../../constants/csv.ts)). This keeps the set of known CSVs discoverable and typo-proof across the whole codebase.
- **Snake-case to camelCase mapping.** CSV headers stay in `snake_case` (`customer_id`, `shipping_zone`, `per_kg`) while domain entities use `camelCase`. Each entity parser owns that mapping explicitly.
- **Branded ID factories are called here.** Raw `string` values coming from CSV are converted to their branded type (`CustomerId`, `ProductId`…) through factory functions (`toCustomerId`, `toProductId`…) exposed by the type layer. No inline `as` casts.
- **Literal unions are runtime-validated.** Fields backed by a finite value set (`level`, `currency`, `type`, `zone`) go through `parseEnum` from [`utils/parse.ts`](../utils/parse.ts), which narrows the TS type and substitutes a safe fallback when the CSV contains an unknown token.
- **Booleans go through `parseBool`.** The legacy used two different string-to-bool conventions (`=== 'true'` and `!== 'false'`). Both are handled by `parseBool(value, fallback)` with an explicit default that documents the intent.
- **Defaults come from typed constants.** When a CSV field is missing (`level`, `shipping_zone`, `time`, `per_kg`, `weight`…), the parser falls back to a named constant from `@/constants/` instead of re-parsing a hard-coded string. Downstream code never has to know these defaults exist.
- **Fail loud on missing or empty files.** `readCsv` throws with a descriptive error that includes the file key and resolved path. Parsers intentionally do not wrap this in `try/catch` — errors propagate up to the entry point where they can produce a proper CLI message. The single exception is `parsePromotions`, which checks `csvFileExists` beforehand to preserve the legacy's "promotions.csv is optional" rule.

## Personal convention

This layout reflects how I structure parsing layers on production projects — one generic low-level reader, one file per entity, typed row interfaces at the boundary, branded IDs through factories, literal unions validated at runtime, imported through a path alias (`@/parsers/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
