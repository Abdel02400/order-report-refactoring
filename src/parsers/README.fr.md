# `src/parsers/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe les parsers CSV qui transforment les fichiers de données bruts en entités typées du domaine.

## Objectif

Isoler chaque morceau d'I/O et de conversion string-to-value derrière des fonctions dédiées. Le reste du code ne lit jamais un CSV ni ne parse un nombre par lui-même — il appelle un parser et reçoit des objets pleinement typés (`Customer`, `Order`, `Product`, etc.), prêts à être consommés par la couche métier.

## Organisation des fichiers

Les parsers sont découpés en **un fichier par entité**, plus un helper bas-niveau partagé :

- [csv.ts](csv.ts) — helper générique `readCsv<T>()` qui transforme un CSV en tableau typé de lignes, throw si le fichier est manquant ou vide
- [customer.ts](customer.ts) — `parseCustomers()`
- [order.ts](order.ts) — `parseOrders()`
- [product.ts](product.ts) — `parseProducts()`
- [shippingZone.ts](shippingZone.ts) — `parseShippingZones()`
- [promotion.ts](promotion.ts) — `parsePromotions()` (tolère un fichier manquant ; un commentaire explique la règle legacy)

### Pourquoi un fichier par entité

- **Scalabilité.** Sur une vraie application, le parser de chaque entité fait évoluer sa propre validation, ses defaults et ses edge cases au fil du temps. Un fichier parser unique deviendrait un dumping ground ; les fichiers par entité restent petits et focalisés.
- **Les noms de fichiers explicites servent de doc.** Lire `import { parseCustomers } from '@/parsers/customer'` indique immédiatement *quelle entité* est parsée et *où* vivent ses règles de parsing.
- **Ownership et scope de changement clairs.** Un changement de parsing des customers ne touche que `customer.ts`. Diffs, code review et git blame restent pertinents.
- **Plus facile à faire évoluer.** Quand une entité a besoin d'un parsing plus riche (validation, schema checks, versioning), le fichier existe déjà pour l'accueillir.

## Notes de design

- **Un lecteur CSV générique unique.** Tous les parsers d'entité partagent `readCsv<T>()` au lieu de réimplémenter le split de lignes, la gestion des headers et l'extraction des champs. Le code legacy dupliquait cette logique cinq fois — la version refactorée la fait une seule fois.
- **Interfaces de ligne typées.** Chaque parser déclare une interface `*CsvRow` listant les colonnes CSV brutes qu'il attend (par exemple `CustomerCsvRow`, `OrderCsvRow`). Passer cette forme à `readCsv<T>` transforme une typo comme `row.shiping_zone` en erreur à la compilation plutôt qu'un `undefined` silencieux au runtime.
- **Clés de fichier typées, pas de strings brutes.** Les parsers n'embarquent jamais de littéraux comme `'customers'` — ils référencent `CSV_FILE.CUSTOMERS` (voir [`constants/csv.ts`](../../constants/csv.ts)). Ça garde l'ensemble des CSV connus discoverable et typo-proof dans toute la codebase.
- **Mapping snake_case → camelCase.** Les headers CSV restent en `snake_case` (`customer_id`, `shipping_zone`, `per_kg`) tandis que les entités du domaine utilisent le `camelCase`. Chaque parser gère explicitement cette transformation.
- **Les factories d'IDs brandés sont appelées ici.** Les valeurs `string` brutes venant du CSV sont converties vers leur type brandé (`CustomerId`, `ProductId`…) via les factory functions (`toCustomerId`, `toProductId`…) exposées par la couche types. Aucun cast `as` inline.
- **Les unions littérales sont validées au runtime.** Les champs adossés à un ensemble fini de valeurs (`level`, `currency`, `type`, `zone`) passent par `parseEnum` depuis [`utils/parse.ts`](../utils/parse.ts), qui narrowe le type TS et substitue un fallback sûr quand le CSV contient un token inconnu.
- **Les booleans passent par `parseBool`.** Le legacy utilisait deux conventions différentes string-to-bool (`=== 'true'` et `!== 'false'`). Les deux sont gérées par `parseBool(value, fallback)` avec un default explicite qui documente l'intention.
- **Les defaults viennent de constantes typées.** Quand un champ CSV est manquant (`level`, `shipping_zone`, `time`, `per_kg`, `weight`…), le parser fallback sur une constante nommée de `@/constants/` au lieu de re-parser une string codée en dur. Le code aval n'a jamais à savoir que ces defaults existent.
- **Fail loud sur fichier manquant ou vide.** `readCsv` throw avec un message d'erreur descriptif incluant la clé du fichier et le chemin résolu. Les parsers n'enrobent volontairement pas cet appel dans un `try/catch` — les erreurs remontent jusqu'au point d'entrée où elles peuvent produire un message CLI propre. La seule exception est `parsePromotions`, qui vérifie `csvFileExists` en amont pour préserver la règle legacy "promotions.csv est optionnel".

## Convention personnelle

Cette organisation reflète la façon dont je structure les couches de parsing sur les projets de production — un lecteur bas-niveau générique, un fichier par entité, interfaces de ligne typées à la frontière, IDs brandés via factories, unions littérales validées au runtime, importées via un alias (`@/parsers/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
