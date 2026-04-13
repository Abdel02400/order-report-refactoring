# `src/calculator/`

This folder holds the pure business logic of the application — all the rules that transform typed entities into the numbers and decisions the final report is built on.

## Purpose

Isolate the "thinking" part of the app from the "doing" part. Parsers handle input, the report layer handles output, and this folder owns the rules in the middle: how a line total is computed, how promotions are resolved, how discounts are capped, how shipping scales with weight, how taxes are applied, and so on.

Every function here is **pure**: it takes typed inputs, returns a result, and never touches I/O, globals, or shared state. That makes the logic trivial to test, safe to reuse across contexts (CLI, API, worker…), and easy to reason about when debugging the output of a specific customer or order.

## File organization

Logic is grouped by **business sub-domain**, each in its own folder. Within a folder, one file per concern:

- [currency/currency.ts](currency/currency.ts) — `getCurrencyRate`
- [pricing/](pricing/) — line-level pricing
    - [promotion.ts](pricing/promotion.ts) — `resolvePromotion` (PERCENTAGE vs FIXED, active check, early returns)
    - [lineTotal.ts](pricing/lineTotal.ts) — `computeLineTotal` (base price, promo application, morning bonus)
- [discount/](discount/) — customer-level discounts
    - [volume.ts](discount/volume.ts) — `computeVolumeDiscount` (tier-based via `switch (true)`, weekend bonus)
    - [loyalty.ts](discount/loyalty.ts) — `computeLoyaltyPoints`, `computeLoyaltyDiscount`
    - [cap.ts](discount/cap.ts) — `capDiscount` (global MAX_DISCOUNT cap, proportional reduction)
- [tax/tax.ts](tax/tax.ts) — `computeTax` (global vs per-item taxable logic)
- [shipping/](shipping/) — shipping cost and handling fees
    - [shipping.ts](shipping/shipping.ts) — `computeShipping` (`switch (true)` dispatch; internal `computePaidShipping` helper handles weight tiers and remote zones)
    - [handling.ts](shipping/handling.ts) — `computeHandling` (tiered via `switch (true)`)

### Why sub-folders per sub-domain

- **Scales with the project.** Each business sub-domain evolves its own rules, edge cases, and helpers. Sub-folders prevent `calculator/` from becoming a flat dump of 15+ files.
- **Explicit paths act as documentation.** `import { computeShipping } from '@/calculator/shipping/shipping'` makes the business context immediately visible in the import statement.
- **Clear ownership and change scope.** A change to shipping rules only touches `shipping/`. Diffs, code review, and git blame stay meaningful.
- **Easier to evolve.** When a sub-domain needs richer logic (a strategy pattern, a rule registry, extra variants), its folder is already there to host extra files.

## Why the folder is called `calculator/`

The entire business layer of this application is calculation: prices, taxes, discounts, shipping, totals. `calculator/` states that intent directly, which reads faster than the more abstract `domain/` when opening the repo for the first time. The same conventions apply — pure functions, constants lifted out, sub-folders per business topic.

## Design notes

- **Pure functions only.** No `fs`, no `console`, no globals. Inputs come in as arguments, results come out as return values. Orchestration and I/O live elsewhere.
- **One responsibility per file.** `volume.ts` only computes the volume discount, `cap.ts` only applies the global cap, `handling.ts` only computes handling fees. Composition happens in the orchestrator (`src/main.ts`).
- **Constants are imported, never inlined.** Every threshold, rate, multiplier, and named zero (`NO_HANDLING`, `NO_LOYALTY_DISCOUNT`, `NO_MORNING_BONUS`, `NO_SHIPPING`, `NO_TAX`, `NO_VOLUME_DISCOUNT`, `NO_DISCOUNT_RATE`, `NO_FIXED_DISCOUNT`) lives in `src/constants/` and is imported here by name. No magic numbers survive in business code.
- **Closed-world unions are used, not string literals.** Checks like `level === CUSTOMER_LEVEL.PREMIUM`, `promo.type === PROMOTION_TYPE.PERCENTAGE`, `WEEKEND_DAYS.includes(dayOfWeek)` go through the typed constants defined in `src/types/`. A typo becomes a compile-time error.
- **`switch (true)` for tiered rules.** Where the legacy used a chain of overriding `if (subtotal > X)` statements, the refactor uses `switch (true)` with the strictest case first and `break`/`return`. Behavior is preserved (the highest matching tier still wins) while making the tier structure readable at a glance.
- **Private helpers stay file-local.** Internal helpers used by a single function (for example `computePaidShipping` inside `shipping/shipping.ts`) are **not exported** so the sub-domain's public surface stays intentional.
- **Behavior is preserved, not "improved".** The goal of this refactor is to keep the legacy output byte-for-byte identical. Known quirks of the legacy (FIXED promo applied per line, silent NaN propagation on bad numeric inputs, the proportional cap, the weekend bonus derived from the first order's date…) are intentionally kept. They are documented as technical debt to be addressed later, once the golden master locks the current behavior.
- **Temporary thin wrappers kept on purpose.** `getCurrencyRate` is a one-line lookup today. It is kept as a domain verb (with JSDoc explaining the intent) so the hard-coded currency table can be replaced later by a real provider (API, cache, historical dates) without touching any call site.

## Personal convention

This layout reflects how I structure the business layer on production projects — sub-folders per business sub-domain, one responsibility per file, pure functions, constants lifted out, closed-world unions instead of string literals, `switch (true)` for tiered rules, JSDoc on non-obvious helpers, imported through a path alias (`@/calculator/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
