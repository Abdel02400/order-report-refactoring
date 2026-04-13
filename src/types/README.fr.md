# `src/types/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe les types du domaine utilisés dans toute l'application.

## Objectif

Centraliser chaque forme d'entité métier derrière un type TypeScript explicite et réutilisable. Le code ne doit jamais redéclarer une forme d'entité inline — les types vivent ici et sont importés là où on en a besoin.

## Organisation des fichiers

Les types sont découpés en **un fichier par entité métier (ou concept partagé)** plutôt que regroupés dans un `types.ts` unique :

- [customer.ts](customer.ts) — `Customer`, `CustomerId`, `toCustomerId`, `CUSTOMER_LEVEL`, `CUSTOMER_LEVELS`, `CustomerLevel`
- [order.ts](order.ts) — `Order`, `OrderId`, `toOrderId`
- [product.ts](product.ts) — `Product`, `ProductId`, `toProductId`
- [shippingZone.ts](shippingZone.ts) — `ShippingZone`, `SHIPPING_ZONE`, `SHIPPING_ZONE_CODES`, `ShippingZoneCode`
- [promotion.ts](promotion.ts) — `Promotion`, `PromotionCode`, `toPromotionCode`, `PROMOTION_TYPE`, `PROMOTION_TYPES`, `PromotionType`
- [currency.ts](currency.ts) — `CURRENCY`, `CURRENCIES`, `Currency`
- [report.ts](report.ts) — `CustomerReportData`, `ReportData`, `CustomerJsonExport` (DTOs consommés par la couche report)

### Pourquoi un fichier par entité

- **Scalabilité.** Sur une vraie application, chaque entité fait grossir son propre set de types associés (DTOs, enums, variantes narrow) au fil du temps. Un fichier unique deviendrait un dumping ground ; les fichiers par entité restent petits et focalisés.
- **Les noms de fichiers explicites servent de doc.** Lire `import { Customer } from '@/types/customer'` indique immédiatement *quelle entité* est concernée et *où* vit son contrat — pas besoin d'ouvrir le fichier.
- **Ownership et scope de changement clairs.** Un changement sur le contrat customer ne touche que `customer.ts`. Diffs, code review et git blame restent pertinents.
- **Plus facile à faire évoluer.** Quand une entité a besoin de variantes plus riches (DTOs d'input, formes de réponse, types dérivés), le fichier existe déjà pour les accueillir.

## IDs brandés

Les entités avec des identifiants opaques exposent un **type d'ID brandé** (`CustomerId`, `ProductId`, `PromotionCode`, `OrderId`) plutôt qu'un simple `string` :

```ts
export type CustomerId = string & { readonly __brand: 'CustomerId' };
```

Au runtime ce sont toujours des strings, mais TypeScript les traite comme des types distincts. Passer un `ProductId` là où un `CustomerId` est attendu devient une erreur à la compilation, ce qui évite toute une classe de bugs silencieux d'inversion d'IDs. Les références inter-entités dans les interfaces (par exemple `Order.customerId: CustomerId`) rendent aussi les relations explicites au niveau du type.

### Factory functions

Pour éviter de disséminer des casts `as CustomerId` dans tout le code, chaque type brandé est livré avec une petite factory function qui effectue le cast à un seul endroit auditable :

```ts
export const toCustomerId = (value: string): CustomerId => value as CustomerId;
```

Les parsers et tout autre code de frontière appellent `toCustomerId(row.id)` au lieu de caster. Quand on voudra ajouter de la validation runtime plus tard (format, longueur, existence), le changement se fait dans la factory et tous les call sites en bénéficient immédiatement.

## Unions fermées

Quand une entité a un **ensemble fini de valeurs valides définies par le métier**, la liste des valeurs fait elle-même partie du type. Le pattern utilise un objet `const` combiné avec `typeof` + `keyof` pour dériver l'union automatiquement, et un tableau `VALUES` associé fournit une liste runtime pour les validators comme `parseEnum` :

```ts
export const CURRENCY = {
    EUR: 'EUR',
    USD: 'USD',
    GBP: 'GBP',
} as const;

export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const CURRENCIES = Object.values(CURRENCY) as readonly Currency[];
```

On obtient trois choses au même endroit : un namespace runtime (`CURRENCY.EUR`), une union littérale stricte (`'EUR' | 'USD' | 'GBP'`) et une liste itérable (`CURRENCIES`) prête à brancher sur des validators runtime. Le même pattern est utilisé pour `CUSTOMER_LEVEL`, `PROMOTION_TYPE` et `SHIPPING_ZONE`.

## Convention personnelle

Cette organisation reflète la façon dont je structure les types sur les projets de production — noms de fichiers explicites par entité, une responsabilité par fichier, IDs brandés avec factory functions pour les références inter-entités, unions fermées pour les ensembles de valeurs finis, importés via un alias (`@/types/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
