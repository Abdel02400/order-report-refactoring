# `src/orchestration/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe la glue entre la couche calculator pure, les parsers et la couche de sortie. Il connecte les sources de données aux règles métier, construit les DTOs consommés par la couche report, et isole l'étape finale d'I/O.

## Objectif

`src/calculator/` possède les règles métier mais ne sait rien des sources de données. `src/parsers/` possède le parsing d'entrée mais ne sait rien des règles métier. `src/report/` possède la mise en forme de sortie mais ne sait rien d'où viennent les valeurs. La couche orchestration est le seul endroit qui appelle les trois pour assembler un rapport complet.

## Organisation des fichiers

- [aggregateOrders.ts](aggregateOrders.ts) — parcourt chaque commande, applique les règles de promotion + line total, et accumule par client le subtotal / weight / items / morning bonus. Expose `CustomerAggregate`.
- [resolveCustomer.ts](resolveCustomer.ts) — retourne un `Customer` pour un id donné, ou un default typé quand l'id est inconnu dans le directory customer (comportement legacy pour les commandes orphelines).
- [buildCustomerReport.ts](buildCustomerReport.ts) — exécute le pipeline par client (remises → plafond → taxe → livraison → manutention → conversion devise → total arrondi) et produit le DTO `CustomerReportData` prêt pour la couche report.
- [buildReport.ts](buildReport.ts) — orchestrateur top-level : lit les CSVs, agrège, trie les customer ids, construit un DTO par client, somme `grandTotal` et `totalTaxCollected`, et retourne un `ReportData` complet.
- [writeOutput.ts](writeOutput.ts) — couche finale d'effets de bord : écrit `output.json` sur disque et imprime le rapport texte via `console.info`. C'est le seul fichier dans `orchestration/` qui fait de l'I/O.

## Notes de design

- **Une responsabilité par fichier.** La couche orchestration a une complexité réelle (parsing, agrégation, dispatch, accumulation), donc le découpage par étape garde chaque fichier court et testable.
- **Parsers et I/O vivent aux extrémités.** `buildReport` est la seule fonction qui importe depuis `parsers/`. `writeOutput` est la seule fonction qui importe `fs`. Tout ce qui est entre les deux reste pur.
- **Pas de magic numbers.** Les valeurs initiales d'accumulateur (`NO_GRAND_TOTAL`, `NO_TAX_COLLECTED`, `NO_LOYALTY_POINTS`, `NO_SUBTOTAL`, `NO_WEIGHT`, `NO_MORNING_BONUS`) viennent de `@/constants/`. Les strings de fallback (`DEFAULT_CUSTOMER_NAME`) aussi.
- **Clés typées via `typedKeys`.** `Object.keys` sur un `Record<CustomerId, X>` retourne `string[]` en TypeScript. Le cast est isolé dans `@/utils/object.ts` ; le code métier appelle `typedKeys(aggregates).sort()` et récupère `CustomerId[]`.
- **Accumulateurs via `reduce`.** `grandTotal` et `totalTaxCollected` sont calculés avec `Array.reduce` sur les DTOs construits plutôt que mutés dans la boucle client. La boucle reste focalisée sur la production de DTOs ; la somme est un one-liner à la fin.

## Convention personnelle

Cette organisation reflète la façon dont je structure les couches d'orchestration sur les projets de production — un fichier par étape, parsers/calculator/report restent indépendants, I/O isolé à la frontière, importés via un alias (`@/orchestration/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
