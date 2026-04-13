# `src/report/`

This folder holds the output layer of the application: turning computed results into the final text report and JSON export.

## Purpose

Isolate every concern about *how the result is presented* from every concern about *how the result is produced*. Calculators give back numbers, the orchestrator assembles them into DTOs, and this folder shapes those DTOs into strings and export records. No math happens here.

## File organization

- [formatter.ts](formatter.ts) — `formatReport(data)` builds the full text report, line by line, with a private `formatCustomerBlock` helper for each customer section
- [format.ts](format.ts) — display helpers (`money` for 2-decimal amounts, `weight` for 1-decimal weights) shared by the formatter so the precision of each value family is defined in a single place
- [jsonExport.ts](jsonExport.ts) — `buildJsonExport(customers)` maps the in-memory DTOs to the snake_case shape written to `output.json`

The report-layer DTOs (`CustomerReportData`, `ReportData`, `CustomerJsonExport`) live in [`@/types/report`](../types/report.ts) alongside the other domain types.

### Why one file per concern

- **Scales with the project.** A new output format (HTML, PDF, CSV summary…) gets its own file instead of crowding a single `report.ts`.
- **Explicit file names act as documentation.** `import { formatReport } from '@/report/formatter'` immediately signals a text-shaping call, while `buildJsonExport` signals a data-shape transformation.
- **Clear ownership and change scope.** A layout change in the text report only touches `formatter.ts`. A schema change in `output.json` only touches `jsonExport.ts`. Diffs, code review, and git blame stay meaningful.

## Design notes

- **No I/O.** `formatReport` returns a string. `buildJsonExport` returns an array. Writing to `console` or to disk belongs in `src/main.ts`, not here.
- **No calculation.** All monetary values arrive already expressed in the customer's target currency (tax and total have already been multiplied by the currency rate upstream). The formatter does nothing but `toFixed(2)` and string assembly.
- **Preserve the legacy output byte-for-byte.** Every quirk of the original script is reproduced on purpose: the `2`-decimal display for money, the `1`-decimal display for weight, the conditional `Morning bonus` and `Handling` lines, the `Loyalty Points` shown as an integer, the blank line between customers, the `Grand Total` and `Total Tax Collected` labelled in EUR even though per-customer totals may be in other currencies. Fixing these belongs to a later iteration, after the golden master locks the current behavior.
- **Snake_case JSON keys on purpose.** `customer_id`, `loyalty_points` match the legacy `output.json` schema. Renaming them would break downstream consumers that depend on this file.
- **Typed DTOs at the boundary.** The report layer accepts `CustomerReportData` / `ReportData` rather than raw `Customer`/`Order`/`Product` entities. That separation lets the orchestrator decide *what* to expose to the output layer — the formatter never has to know how prices or discounts were computed.

## Personal convention

This layout reflects how I structure output layers on production projects — one file per output concern, pure string/data shaping, typed DTOs at the boundary, I/O kept out, legacy quirks preserved until a dedicated iteration swaps them out. The goal is to write code today the same way I would on a codebase that has to live for years.
