# `src/utils/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe de petits helpers focalisés qui ne sont liés à aucun domaine métier spécifique.

## Objectif

Éviter de dupliquer des opérations bas-niveau — arrondis, parsing de littéraux, vérification d'existence de fichier — à travers les couches calculator, parsers ou report. Quand le même snippet apparaît à deux endroits ou plus, il vient ici sous un nom clair, avec une signature propre et une doc.

## Organisation des fichiers

Les helpers sont regroupés par **préoccupation technique**, un fichier par concern :

- [number.ts](number.ts) — helpers numériques (`round2` pour l'arrondi à 2 décimales style monétaire)
- [date.ts](date.ts) — helpers date/heure (`parseHour` pour extraire l'heure d'une chaîne `HH:MM`)
- [parse.ts](parse.ts) — parsers string-to-value à la frontière I/O (`parseEnum` pour narrower une string en union littérale avec validation runtime, `parseBool` avec fallback explicite)
- [csv.ts](csv.ts) — helpers liés au CSV (`csvFileExists` pour vérifier l'existence d'un fichier CSV connu par sa clé)
- [object.ts](object.ts) — helpers d'objet (`typedKeys` pour récupérer le type de clé brandé que `Object.keys` perd vers `string[]`)

### Pourquoi ce découpage

- **Scalabilité.** À mesure que plus de helpers émergent (date, string, async…), chacun a son propre fichier plutôt que de s'empiler dans un `utils.ts` unique.
- **Les noms de fichiers explicites servent de doc.** Lire `import { parseEnum } from '@/utils/parse'` indique immédiatement la catégorie de helper sans ouvrir le fichier.
- **Frontière claire.** Une fonction n'a sa place ici que si elle reste utile sans rien savoir de `Customer`, `Order`, `Product`, etc. Tout ce qui est lié à une entité métier appartient à `@/calculator/` ou à proximité de son owner, pas ici.

## Notes de design

- **Pas de logique métier.** Ces helpers n'appliquent jamais de taux de taxe, de paliers de remise ou de règles de livraison. Ils sont mécaniques, techniques et indépendants du sens de l'application.
- **Fonctions pures.** Même entrée → même sortie. Pas de globals, pas d'état caché. Les effets de bord sont explicites quand l'intention est de faire de l'I/O (par exemple `csvFileExists` lit le filesystem).
- **Une responsabilité par fichier.** Un fichier qui commence à mélanger des helpers sans rapport est un smell — splitter.
- **Documenté via JSDoc.** Les helpers qui encodent une convention (`parseEnum`, `parseBool`) sont livrés avec un bloc JSDoc décrivant l'intention, les paramètres, le comportement du retour et un court exemple. L'IDE affiche ça au hover à chaque call site.

## Convention personnelle

Cette organisation reflète la façon dont je structure les helpers transverses sur les projets de production — regroupés par préoccupation technique, une responsabilité par fichier, purs par défaut, documentés via JSDoc, importés via un alias (`@/utils/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
