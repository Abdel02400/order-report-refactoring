# `src/utils/`

> French version available at [README.fr.md](README.fr.md).

This folder holds small, focused helpers that are not tied to a single business domain.

## Purpose

Avoid duplicating low-level operations — rounding, literal parsing, file existence checks — across the domain, parsers, or report layers. When the same snippet shows up in two or more places, it moves here under a clear name with a proper signature and documentation.

## File organization

Helpers are grouped by **technical concern**, with one file per concern:

- [number.ts](number.ts) — numeric helpers (`round2` for money-style 2-decimal rounding)
- [date.ts](date.ts) — date/time helpers (`parseHour` to extract the hour from a `HH:MM` string)
- [parse.ts](parse.ts) — string-to-value parsers at the I/O boundary (`parseEnum` for runtime-validated literal narrowing, `parseBool` with explicit fallback)
- [csv.ts](csv.ts) — CSV-related helpers (`csvFileExists` for checking a known CSV file by key)
- [object.ts](object.ts) — object helpers (`typedKeys` to recover the branded key type that `Object.keys` loses to `string[]`)

### Why this layout

- **Scales with the project.** As more helpers emerge (date, string, async…), each gets its own file instead of piling up in a single `utils.ts`.
- **Explicit file names act as documentation.** Reading `import { parseEnum } from '@/utils/parse'` immediately tells you the category of helper without opening the file.
- **Clear boundary.** A function only belongs here if it stays useful without knowing about `Customer`, `Order`, `Product`, etc. Anything tied to a business entity belongs in `@/calculator/` or near its owner, not here.

## Design notes

- **No business logic.** These helpers never apply tax rates, discount tiers, or shipping rules. They are mechanical, technical, and independent of the app's meaning.
- **Pure functions.** Same input → same output. No globals, no hidden state. Side effects are explicit when the intent is I/O (for example `csvFileExists` reads the filesystem).
- **One responsibility per file.** A file that starts to mix unrelated helpers is a smell — split it.
- **Documented via JSDoc.** Helpers that encode a convention (`parseEnum`, `parseBool`) ship with a JSDoc block describing intent, parameters, return behavior, and a short example. The IDE surfaces this on hover at every call site.

## Personal convention

This layout reflects how I structure cross-cutting helpers on production projects — grouped by technical concern, one responsibility per file, pure by default, documented through JSDoc, imported through a path alias (`@/utils/...`). The goal is to write code today the same way I would on a codebase that has to live for years.
