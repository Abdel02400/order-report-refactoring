# `src/constants/`

This folder holds all business constants used across the application.

## Purpose

Centralize every magic number and literal value behind an explicit, importable name. Code should never embed raw values such as `0.2` or `200` directly — those always live here and are imported where needed.

## File organization

Constants are split into **one file per business domain** rather than grouped in a single `constants.ts`:

- [tax.ts](tax.ts) — taxation rules (VAT rate)
- [discounts.ts](discounts.ts) — discount rules (global cap, volume tiers, weekend bonus, loyalty tiers)
- [shipping.ts](shipping.ts) — shipping and handling fees (free-shipping threshold, weight tiers, remote zones, default zone fallback, handling tiers)
- [loyalty.ts](loyalty.ts) — loyalty program parameters (point ratio, premium threshold)
- [promotions.ts](promotions.ts) — promotional rules (morning bonus hour and rate)
- [currency.ts](currency.ts) — currency conversion rates (EUR / USD / GBP multipliers)
- [product.ts](product.ts) — product defaults (default weight when missing in CSV)
- [order.ts](order.ts) — order defaults (default time when missing in CSV)

### Why one file per domain

- **Scales with the project.** On a real application, each domain grows its own set of constants over time. A single file would become a dumping ground; domain files stay small and focused.
- **Explicit file names act as documentation.** Reading `import { TAX } from '@/constants/tax'` immediately tells you *where* that value comes from and *which domain* owns it — no need to open the file to find out.
- **Clear ownership and change scope.** A change to shipping rules only touches `shipping.ts`. Diffs, code review, and git blame all stay meaningful.
- **Easier to evolve.** When a domain needs richer types (enums, lookup tables, derived values), the file is already there to host them.

## Personal convention

This layout reflects how I structure constants on production projects — explicit file names per domain, one responsibility per file, imported through a path alias (`@/constants/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
