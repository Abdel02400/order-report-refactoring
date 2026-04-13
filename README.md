# Order report refactoring

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" />
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

> French version available at [README.fr.md](README.fr.md).

## Installation

### Requirements

- Node.js version 20.x or higher
- pnpm version 8.x or higher

### Commands

```bash
# Install dependencies
pnpm install

# Lint the code
pnpm lint

# Format the code
pnpm format
```

## Execution

### Run the refactored code

```bash
# Run the refactored report
pnpm start

# Run the legacy script (kept for the Golden Master comparison)
pnpm legacy
```

### Run the tests

```bash
# Unit tests first, then the Golden Master end-to-end test
# (Golden Master only runs when every unit test is green)
pnpm test

# Only unit tests (fast — no shell round-trip)
pnpm test:unit

# Only the Golden Master
pnpm test:golden
```

## Refactoring choices

### Problems identified in the legacy

1. **God function** — `run()` in [legacy/orderReportLegacy.ts](legacy/orderReportLegacy.ts) is ~350 lines and owns CSV parsing, business rules, formatting, and I/O all at once.
    - Impact: nothing is unit-testable in isolation; any change risks breaking something unrelated.

2. **No real typing** — `type Customer = any`, `type Order = any`, `type Product = any`, `type ShippingZone = any`, `type Promotion = any`.
    - Impact: TypeScript offers zero protection; typos on field names fail silently at runtime.

3. **Duplicated CSV parsing** — line splitting, header handling, and field extraction are rewritten five times with small variations.
    - Impact: five places to change when the CSV format evolves, five chances of divergence.

4. **Magic numbers everywhere** — `0.2`, `50`, `0.3`, `1.2`, `1.05`, `200`, `0.01`, thresholds, weight tiers, shipping multipliers, morning-bonus rate, currency rates, all hard-coded without names.
    - Impact: unreadable, ungreppable, untestable, impossible to change safely.

5. **Hidden rules buried in the pipeline** — morning bonus based on the hour, weekend bonus based on the first order's date, remote-zone surcharge on specific zone ids, proportional cap when total discount exceeds the global limit.
    - Impact: you only discover these by reading the whole function top-to-bottom.

6. **String-literal comparisons scattered** — `currency === 'USD'`, `level === 'PREMIUM'`, `promo.type === 'PERCENTAGE'` repeated throughout the code.
    - Impact: a rename of `'PREMIUM'` means touching every file that compares against it.

7. **Silent `try/catch` blocks** — bad rows are skipped with a bare `continue` and no logging.
    - Impact: data quality issues never surface; the report is produced from a subset that nobody is aware of.

8. **CSV-parsing bugs on Windows (CRLF)** — because the script uses `split('\n')`, the trailing `\r` on Windows pollutes the last column of every CSV. Three consequences are baked into the current output:
    - `taxable === 'true'` is always `false` → tax is always zero.
    - `currency === 'USD'` is always `false` → currency rate falls back to 1.0 for USD and GBP customers.
    - The polluted currency value is shown verbatim in the report; the trailing `\r` is only invisible because it is absorbed by the trailing `\n` of each line.
    - Impact: numerically wrong output, inconsistent with the displayed currency label.

9. **I/O mixed with calculation** — the function prints to the console and writes `output.json` from the middle of the aggregation loop.
    - Impact: cannot reuse the logic in an API, worker, or test without triggering the side effects.

10. **No type-safe IDs** — `customer_id`, `product_id`, `promo_code` are all plain `string`. Passing a `ProductId` where a `CustomerId` is expected compiles fine.
    - Impact: silent ID-mixup bugs.

### Solutions applied

1. **Split the single function into layered responsibilities** — `parsers/`, `calculator/`, `orchestration/`, `report/`, `utils/`.
    - Rationale: each layer has a clear input/output contract; orchestration is the only place that knows about all of them.

2. **Branded IDs with factory helpers** (`CustomerId`, `ProductId`, `OrderId`, `PromotionCode`) created via `toCustomerId(value)`-style functions.
    - Rationale: type-level protection against ID mixups, and a single place to plug runtime validation later.

3. **Closed-world unions for finite value sets** (`CUSTOMER_LEVEL`, `CURRENCY`, `PROMOTION_TYPE`, `SHIPPING_ZONE`) using the `const object + typeof + keyof` pattern, paired with a runtime `*_CODES` / `*_LEVELS` array plugged into `parseEnum`.
    - Rationale: one source of truth for allowed values, runtime validation at the I/O boundary, autocompletion in the IDE, renames in one place.

4. **Generic typed CSV reader** — `readCsv<T extends CsvRow>(fileKey)` with per-entity `*CsvRow` interfaces.
    - Rationale: a typo in a row access becomes a compile-time error; the five duplicate parsing blocks collapse into one.

5. **Typed CSV file keys** — parsers reference `CSV_FILE.CUSTOMERS` rather than the literal `'customers'`.
    - Rationale: typo-proof, discoverable via autocompletion, matches the `SHIPPING_ZONE.ZONE_3` convention used elsewhere.

6. **All magic numbers lifted into `@/constants/*`** — named zeros (`NO_TAX`, `NO_HANDLING`, `NO_SHIPPING`, `NO_VOLUME_DISCOUNT`, `NO_LOYALTY_DISCOUNT`, `NO_MORNING_BONUS`, `NO_DISCOUNT_RATE`, `NO_FIXED_DISCOUNT`, `NO_GRAND_TOTAL`, `NO_TAX_COLLECTED`, `NO_SUBTOTAL`, `NO_WEIGHT`, `NO_LOYALTY_POINTS`) and defaults (`DEFAULT_PRODUCT_WEIGHT`, `DEFAULT_ORDER_TIME`, `DEFAULT_ZONE_PER_KG`, `DEFAULT_CURRENCY_RATE`, `DEFAULT_CUSTOMER_NAME`, `FULL_PRICE_FACTOR`, `PERCENT_BASE`).
    - Rationale: readable code, greppable values, one place to change a rule.

7. **`switch (true)` for tiered rules** — volume discount, loyalty discount, handling fee, shipping cost all use `switch (true)` with the strictest case first.
    - Rationale: preserves legacy behavior exactly (the highest matching tier wins) while making the tier structure readable at a glance.

8. **Pure-function calculators** — `src/calculator/` contains only pure functions with typed inputs and outputs. No `fs`, no `console`, no global state.
    - Rationale: every rule is unit-testable in isolation; the orchestration layer composes them.

9. **I/O isolated at the edges** — parsers read files, `writeOutput` writes `output.json` and prints, everything else is pure.
    - Rationale: a future API route, worker, or scheduler can call `buildReport()` without triggering any side effect.

10. **CRLF quirks documented and preserved for iso-behavior** — the three Windows-specific CRLF bugs are reproduced deliberately so the Golden Master matches byte-for-byte. Tracked in the technical-debt section below.

11. **Full Golden Master + unit test suite** — `tests/golden.master.test.ts` runs `pnpm legacy` and `pnpm start` and compares the outputs character-by-character; 15 co-located `*.test.ts` files cover every pure function and every edge case.
    - Rationale: prevents regressions during the refactor and locks the current behavior before any bug fix.

### Architecture

Six layers, each with a single responsibility:

```
┌─────────────┐   Read CSVs into typed domain entities
│   parsers/  │   readCsv<T>, parseCustomers, parseOrders, etc.
└──────┬──────┘
       │
┌──────▼───────┐  Pure business rules on typed entities
│  calculator/ │  pricing, discount, tax, shipping, currency
└──────┬───────┘
       │
┌──────▼──────────┐  Glue — aggregate orders, resolve customers,
│  orchestration/ │  build per-customer DTO, build report,
└──────┬──────────┘  write output
       │
┌──────▼──────┐   DTO → string / JSON
│   report/   │   formatter, jsonExport, format helpers
└─────────────┘
```

Cross-cutting folders:

- **`types/`** — entity shapes (`Customer`, `Order`, `Product`…), branded IDs, closed-world unions (`SHIPPING_ZONE`, `CURRENCY`…), report DTOs.
- **`constants/`** — every magic number under an explicit name, grouped per business domain.
- **`utils/`** — technical helpers with no business knowledge (`round2`, `parseHour`, `parseEnum`, `parseBool`, `csvFileExists`, `typedKeys`).
- **`tests/`** — co-located under each relevant folder for unit tests; the end-to-end Golden Master lives at the project root.

Data flow:

1. `main.run()` calls `buildReport()`.
2. `buildReport()` parses the five CSVs.
3. `aggregateOrders()` walks every order, applies promotion and line-total rules, and builds a per-customer aggregate.
4. For each customer id (sorted), `buildCustomerReport()` resolves the customer, runs the discount → cap → tax → shipping → handling → currency pipeline, and returns a `CustomerReportData` DTO.
5. `buildReport()` sums `grandTotal` and `totalTaxCollected` from the DTO list and returns a `ReportData`.
6. `formatReport()` shapes the `ReportData` into the legacy's exact text output; `buildJsonExport()` produces the snake_case `output.json` payload.
7. `writeOutput()` writes the JSON to disk and prints the report via `console.info`.

### Concrete examples

**Example 1 — tiered discount rule**

- **Problem**: the legacy used four sequential `if` statements that each overwrote the previous `disc` value. Easy to miss that the strictest matching tier is the one that wins.

    ```ts
    // legacy
    let disc = 0.0;
    if (sub > 50) disc = sub * 0.05;
    if (sub > 100) disc = sub * 0.1;
    if (sub > 500) disc = sub * 0.15;
    if (sub > 1000 && level === 'PREMIUM') disc = sub * 0.2;
    ```

- **Solution**: `switch (true)` with the strictest case first, early `break`, named constants, closed-world union comparison.

    ```ts
    // src/calculator/discount/volume.ts
    switch (true) {
        case subtotal > VOLUME_TIER_PREMIUM_MIN && level === CUSTOMER_LEVEL.PREMIUM:
            disc = subtotal * VOLUME_TIER_PREMIUM_RATE;
            break;
        case subtotal > VOLUME_TIER_3_MIN:
            disc = subtotal * VOLUME_TIER_3_RATE;
            break;
        case subtotal > VOLUME_TIER_2_MIN:
            disc = subtotal * VOLUME_TIER_2_RATE;
            break;
        case subtotal > VOLUME_TIER_1_MIN:
            disc = subtotal * VOLUME_TIER_1_RATE;
            break;
        default:
            disc = NO_VOLUME_DISCOUNT;
    }
    ```

**Example 2 — CSV parsing**

- **Problem**: the same ~10 lines of splitting, filtering, and positional access were repeated for every CSV. A typo on `parts[4]` vs `parts[5]` failed silently.
- **Solution**: a single generic `readCsv<T>(fileKey)` that returns typed rows keyed by header name. Each entity parser declares a `*CsvRow` interface so field typos are caught at compile time.

    ```ts
    // src/parsers/customer.ts
    interface CustomerCsvRow extends CsvRow {
        id: string;
        name: string;
        level: string;
        shipping_zone: string;
        currency: string;
    }

    const rows = readCsv<CustomerCsvRow>(CSV_FILE.CUSTOMERS);
    ```

**Example 3 — IDs**

- **Problem**: `customer_id`, `product_id`, `promo_code` were all plain `string`. A misused ID compiled fine and produced wrong but silent output.
- **Solution**: branded types plus factory helpers.

    ```ts
    // src/types/customer.ts
    export type CustomerId = string & { readonly __brand: 'CustomerId' };
    export const toCustomerId = (value: string): CustomerId => value as CustomerId;

    // at the I/O boundary
    const id = toCustomerId(row.id);
    ```

**Example 4 — I/O isolation**

- **Problem**: `console.log` and `fs.writeFileSync` live in the middle of the calculation loop.
- **Solution**: calculations return DTOs, a single `writeOutput(text, json)` at the end performs the side effects. `buildReport()` itself has no side effects and is callable from a test, a worker, or an API.

## Technical debt identified

The refactor preserves the legacy output byte-for-byte, including bugs. Known issues to address in a later iteration:

1. **CRLF parsing bugs on Windows** — `taxable` is always false, currency rate always 1.0, currency value carries a trailing `\r`. A proper CSV library (or `split(/\r?\n/)`) fixes all three. Fix deferred because it would diverge from the current legacy output.

2. **Silent numeric parsing** — `parseInt('AAA')` returns `NaN` and silently contaminates every downstream sum. Should be replaced by `parseIntStrict` / `parseFloatStrict` helpers that throw with the offending field name.

3. **Hard-coded currency rates** — `CURRENCY_RATES` is a static table. A real system should fetch rates from an API or config with an audit trail per day. The `getCurrencyRate` wrapper is intentionally kept so call sites do not have to change when the backing store does.

4. **FIXED promotion applied per line** — the legacy multiplies a flat-amount promotion by the order quantity, which is almost certainly not the intent.

5. **Volume-discount cap proportional reduction** — when `volume + loyalty > MAX_DISCOUNT`, both are scaled proportionally. Unusual business rule; worth confirming with stakeholders.

6. **Weekend bonus derived from the first order's date** — only the first item's date drives the multiplier, which is surprising for a customer who orders across multiple days.

7. **Grand Total labelled in EUR regardless of currency** — per-customer totals can be in EUR, USD, or GBP but the `Grand Total` line mixes them and still says "EUR".
