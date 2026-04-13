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

## Limits and future improvements

### What was not done (due to time constraints)

- [ ] **Strict numeric parsing helpers** (`parseIntStrict` / `parseFloatStrict`) — today `parseInt('AAA')` returns `NaN` and contaminates every downstream sum silently, exactly like the legacy. Helpers that throw with the offending field name would replace this.
- [ ] **Orchestration-layer unit tests** — `aggregateOrders`, `resolveCustomer`, `buildCustomerReport`, `buildReport`, `writeOutput` are covered transitively by the Golden Master but have no dedicated unit tests. Low risk because the composed functions already have unit tests, but worth adding for finer-grained regression isolation.
- [ ] **Runtime validation inside branded-ID factories** — `toCustomerId`, `toProductId`, etc. currently only cast. They are the right place to add format / length / existence checks; deferred to keep iso-behavior.
- [ ] **Parser unit tests against in-memory fixtures** — parsers are tested end-to-end via the Golden Master only. Mocking `fs.readFileSync` with fixture strings would isolate parsing edge cases from real data.
- [ ] **Structured error output for CLI failures** — `run()` currently lets exceptions bubble to the terminal's default handler. A top-level `try/catch` in `main.ts` that prints a user-friendly message and exits with a non-zero code would be cleaner.

### Accepted trade-offs

- **CRLF legacy bugs reproduced on purpose** — on Windows the legacy has three silent bugs caused by `split('\n')` leaving a trailing `\r` on the last CSV column:
    - `taxable === 'true'` is always false → tax is always zero.
    - `currency === 'USD'` is always false → conversion rate stays at 1.0 for USD / GBP.
    - The polluted currency value is displayed verbatim, the trailing `\r` being absorbed by the line separator.

    Justification: the Golden Master must match byte-for-byte on Windows. Fixing the parser would diverge the refactored output from the captured reference. The bugs are reproduced deliberately and listed here so a future iteration can address them together with an updated golden.

- **FIXED promotion applied per line** — the legacy multiplies a flat-amount discount by `order.qty`, which is almost certainly not the intent. Preserved to match the legacy output.

- **Proportional discount cap** — when `volumeDiscount + loyaltyDiscount > MAX_DISCOUNT`, both are scaled down proportionally. Unusual business rule; kept as-is because altering it would change the reported breakdown.

- **Weekend bonus derived from the first order's date only** — multi-day customers always get the multiplier based on their first order, which is surprising. Preserved.

- **Grand Total labelled in EUR across currencies** — per-customer totals are already converted to their target currency, so summing them into `Grand Total` and labelling the result "EUR" mixes units. Preserved.

- **Hard-coded currency rates** — `CURRENCY_RATES` is a static in-code table (EUR=1.0, USD=1.1, GBP=0.85). Real exchange rates change intra-day and historical rates are not tracked, so reprocessing a past order with today's table silently rewrites its value. A customer paying in a non-listed currency (BRL, JPY, CHF…) falls back to rate 1.0 without any warning. Preserved because the legacy behaves the same way.

- **Timezone-sensitive date and hour handling** — `new Date('2025-01-15').getDay()` returns the day-of-week in the **local timezone of the machine that runs the script**. The same data processed on a server in Tokyo (UTC+9) and in Paris (UTC+1) can produce different weekend bonuses near midnight UTC. Likewise, `parseHour('09:15')` extracts an hour with no timezone attached, so the "morning bonus before 10:00" rule is ambiguous for customers in other regions. Preserved because the legacy has the same issue; the fix involves choosing an explicit reference timezone (UTC, customer-local, or business-local) and enforcing it throughout.

- **No validation of incoming date strings** — `new Date('not-a-date')` returns `Invalid Date`, `getDay()` returns `NaN`, and `NaN === 0 || NaN === 6` is `false`, so a bad date silently skips the weekend bonus without any warning. A typo in the CSV (e.g. `2025-13-45`) goes unnoticed.

- **Monetary amounts stored as JavaScript `number` (float64)** — every total, discount, tax, and shipping fee accumulates in IEEE-754 floats. The classic `0.1 + 0.2 !== 0.3` bug is latent throughout: on large batches, cents can drift and the displayed total may be a few cents off the sum of its components. The simple fix is a handful of helpers that convert to integer minor units (cents) for arithmetic, then back to decimal for display — no external dependency needed. Preserved to match the legacy.

- **Customers without orders are invisible** — the report loops over customers *that have ordered*, so a row in `customers.csv` with no matching entry in `orders.csv` never appears in the output. This is the legacy behavior and may be intentional, but it should be confirmed with the business before trusting the report as an exhaustive customer list.

- **Naive CSV splitting (no escaping)** — our `readCsv` splits rows on a literal `,`. A value that contains a comma (`"Smith, John"`) or an embedded newline would corrupt every column after it. Works today because the current data has none, but a single edit to a customer name could break the whole pipeline. A proper CSV library is the real fix.

- **UTF-8 encoding hard-coded** — `fs.readFileSync(path, 'utf-8')` silently mangles any CSV exported in another encoding (Latin-1, Windows-1252, Excel French exports with accents…). There is no BOM detection, no configurable encoding, and no warning when a row contains replacement characters.

- **Single `console.info(reportText)` for the text report** — keeps the legacy's behavior (the shell captures stdout). A proper CLI would distinguish stdout (payload) from stderr (logs).

### Future improvement ideas

- Replace the hand-rolled CSV reader with a standard library (`csv-parse`) — the one case where the RFC 4180 quoting / escaping / embedded-newline rules are complex enough that rolling a correct parser by hand is not worth it.
- Drive `CURRENCY_RATES` from an external provider (API, cache, daily snapshots) with a historical table so past orders can be replayed with the rate of their own date. The `getCurrencyRate` wrapper is already in place so call sites will not change.
- Introduce an explicit business timezone (for example `Europe/Paris`) and derive `getDay()` / `parseHour` from it using Node's built-in `Intl.DateTimeFormat` — a ~10-line helper (`new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })`) is enough, no external date library required.
- Introduce a tiny money helper (`toCents(value) = Math.round(value * 100)` / `fromCents(cents) = cents / 100`) and run every accumulation in integer cents to kill float drift. Again, no external dependency needed for the current operations (addition, subtraction, multiplication by an integer).
- Validate CSV date strings at parse time (format + reality check), fall back or throw on invalid dates instead of silently producing `NaN`.
- Extend the `Currency` union (or make it dynamic from the rates provider) so a CSV containing a non-listed currency is either rejected up front or gracefully handled.
- Extract `src/domain/` for richer business policies if the rules grow beyond pure calculation (validation, workflows, eligibility checks).
- Migrate to ESM once the tooling (ts-node / Jest) stabilizes, to replace `require.main === module` with a cleaner entry detection.
- Add a `--dry-run` flag on `pnpm start` to skip the `output.json` write (useful for CI checks and preview).
- Add a coverage threshold to Jest (`--coverage --coverageThreshold=...`) once orchestration tests are in.
