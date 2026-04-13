# `src/orchestration/`

> French version available at [README.fr.md](README.fr.md).

This folder holds the glue between the pure calculator layer, the parsers, and the output layer. It wires data sources to business rules, builds the DTOs consumed by the report layer, and isolates the final I/O step.

## Purpose

`src/calculator/` owns business rules but knows nothing about data sources. `src/parsers/` owns input parsing but knows nothing about business rules. `src/report/` owns output shaping but knows nothing about where values come from. The orchestration layer is the only place that calls all three to assemble a full report.

## File organization

- [aggregateOrders.ts](aggregateOrders.ts) — walks every order, applies promotion + line-total rules, and accumulates per-customer subtotal / weight / items / morning bonus. Exposes `CustomerAggregate`.
- [resolveCustomer.ts](resolveCustomer.ts) — returns a `Customer` for a given id, or a typed default when the id is unknown in the customer directory (legacy behavior for orphan orders).
- [buildCustomerReport.ts](buildCustomerReport.ts) — runs the per-customer pipeline (discounts → cap → tax → shipping → handling → currency conversion → rounded total) and produces the `CustomerReportData` DTO ready for the report layer.
- [buildReport.ts](buildReport.ts) — top-level orchestrator: reads CSVs, aggregates, sorts customer ids, builds one DTO per customer, sums `grandTotal` and `totalTaxCollected`, and returns a complete `ReportData`.
- [writeOutput.ts](writeOutput.ts) — final side-effect layer: writes `output.json` to disk and prints the text report via `console.info`. This is the only file in `orchestration/` that performs I/O.

## Design notes

- **Single responsibility per file.** The orchestration layer has real-world complexity (parsing, aggregation, dispatch, accumulation), so splitting by step keeps each file short and testable.
- **Parsers and I/O live at the edges.** `buildReport` is the only function that imports from `parsers/`. `writeOutput` is the only function that imports `fs`. Everything in between stays pure.
- **No magic numbers.** Accumulator starting values (`NO_GRAND_TOTAL`, `NO_TAX_COLLECTED`, `NO_LOYALTY_POINTS`, `NO_SUBTOTAL`, `NO_WEIGHT`, `NO_MORNING_BONUS`) come from `@/constants/`. Fallback strings (`DEFAULT_CUSTOMER_NAME`) live there too.
- **Typed keys via `typedKeys`.** `Object.keys` on a `Record<CustomerId, X>` returns `string[]` in TypeScript. The cast is isolated in `@/utils/object.ts`; business code calls `typedKeys(aggregates).sort()` and gets `CustomerId[]` back.
- **Accumulators via `reduce`.** `grandTotal` and `totalTaxCollected` are computed with `Array.reduce` over the built DTOs rather than mutated inside the customer loop. The loop stays focused on producing DTOs; the summation is a one-liner at the end.

## Personal convention

This layout reflects how I structure orchestration layers on production projects — one file per step, parsers/calculator/report stay independent, I/O isolated at the boundary, imported through a path alias (`@/orchestration/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
