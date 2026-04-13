# `src/report/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe la couche de sortie de l'application : transformer les résultats calculés en rapport texte final et export JSON.

## Objectif

Isoler chaque préoccupation liée à *comment le résultat est présenté* de celles liées à *comment le résultat est produit*. Les calculators rendent des chiffres, l'orchestrateur les assemble en DTOs, et ce dossier transforme ces DTOs en strings et en enregistrements d'export. Aucun calcul ici.

## Organisation des fichiers

- [formatter.ts](formatter.ts) — `formatReport(data)` construit le rapport texte complet ligne par ligne, avec un helper privé `formatCustomerBlock` pour chaque bloc client
- [format.ts](format.ts) — helpers d'affichage (`money` pour les montants à 2 décimales, `weight` pour les poids à 1 décimale) partagés par le formatter, pour que la précision de chaque famille de valeur soit définie à un seul endroit
- [jsonExport.ts](jsonExport.ts) — `buildJsonExport(customers)` mappe les DTOs en mémoire vers la forme snake_case écrite dans `output.json`

Les DTOs de la couche report (`CustomerReportData`, `ReportData`, `CustomerJsonExport`) vivent dans [`@/types/report`](../types/report.ts) aux côtés des autres types du domaine.

### Pourquoi un fichier par concern

- **Scalabilité.** Un nouveau format de sortie (HTML, PDF, résumé CSV…) a son propre fichier au lieu d'encombrer un `report.ts` unique.
- **Les noms de fichiers explicites servent de doc.** `import { formatReport } from '@/report/formatter'` signale immédiatement un appel de mise en forme texte, tandis que `buildJsonExport` signale une transformation de forme de données.
- **Ownership et scope de changement clairs.** Un changement de layout dans le rapport texte ne touche que `formatter.ts`. Un changement de schéma dans `output.json` ne touche que `jsonExport.ts`. Diffs, code review et git blame restent pertinents.

## Notes de design

- **Pas d'I/O.** `formatReport` retourne une string. `buildJsonExport` retourne un tableau. Écrire sur `console` ou sur disque est la responsabilité de `src/main.ts`, pas d'ici.
- **Pas de calcul.** Toutes les valeurs monétaires arrivent déjà exprimées dans la devise cible du client (la taxe et le total ont déjà été multipliés par le taux de change en amont). Le formatter ne fait que `toFixed(2)` et de l'assemblage de string.
- **Préserver la sortie legacy caractère par caractère.** Chaque quirk du script original est reproduit volontairement : affichage à `2` décimales pour la monnaie, à `1` décimale pour le poids, lignes conditionnelles `Morning bonus` et `Handling`, `Loyalty Points` affichés en entier, ligne vide entre clients, `Grand Total` et `Total Tax Collected` labellisés en EUR même si les totaux par client sont dans d'autres devises. Corriger ces points appartient à une itération ultérieure, une fois que le golden master verrouille le comportement actuel.
- **Clés JSON en snake_case volontairement.** `customer_id`, `loyalty_points` matchent le schéma legacy `output.json`. Les renommer casserait les consumers downstream qui dépendent de ce fichier.
- **DTOs typés à la frontière.** La couche report accepte `CustomerReportData` / `ReportData` plutôt que les entités brutes `Customer`/`Order`/`Product`. Cette séparation permet à l'orchestrateur de décider *quoi* exposer à la couche de sortie — le formatter n'a jamais à savoir comment les prix ou les remises ont été calculés.

## Convention personnelle

Cette organisation reflète la façon dont je structure les couches de sortie sur les projets de production — un fichier par concern de sortie, mise en forme pure string/data, DTOs typés à la frontière, I/O tenu à l'écart, quirks legacy préservés jusqu'à une itération dédiée. L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
