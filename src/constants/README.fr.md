# `src/constants/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe toutes les constantes métier utilisées dans l'application.

## Objectif

Centraliser chaque magic number et valeur littérale derrière un nom explicite et importable. Le code ne doit jamais contenir de valeur brute comme `0.2` ou `200` — elles vivent ici et sont importées là où on en a besoin.

## Organisation des fichiers

Les constantes sont découpées en **un fichier par domaine métier** plutôt que regroupées dans un `constants.ts` unique :

- [tax.ts](tax.ts) — règles de taxation (taux de TVA)
- [discounts.ts](discounts.ts) — règles de remise (plafond global, paliers volume, bonus weekend, paliers fidélité)
- [shipping.ts](shipping.ts) — frais de livraison et manutention (seuil de livraison gratuite, paliers de poids, zones lointaines, fallback zone par défaut, paliers de manutention)
- [loyalty.ts](loyalty.ts) — paramètres du programme fidélité (ratio de points, seuil premium)
- [promotions.ts](promotions.ts) — règles promotionnelles (heure et taux du bonus matinal)
- [currency.ts](currency.ts) — taux de conversion devise (multiplicateurs EUR / USD / GBP)
- [product.ts](product.ts) — valeurs par défaut des produits (poids par défaut si manquant dans le CSV)
- [order.ts](order.ts) — valeurs par défaut des commandes (heure par défaut si manquante dans le CSV)
- [customer.ts](customer.ts) — valeurs par défaut des clients (nom de secours quand une commande référence un client inconnu)
- [date.ts](date.ts) — constantes liées aux dates (objet `DAY_OF_WEEK` + type `DayOfWeek`)
- [report.ts](report.ts) — valeurs initiales des accumulateurs du report builder (zéros nommés : `NO_GRAND_TOTAL`, `NO_TAX_COLLECTED`, `NO_SUBTOTAL`, `NO_WEIGHT`)

### Pourquoi un fichier par domaine

- **Scalabilité.** Sur une vraie application, chaque domaine fait grossir son propre set de constantes au fil du temps. Un fichier unique deviendrait un dumping ground ; les fichiers par domaine restent petits et focalisés.
- **Les noms de fichiers explicites servent de doc.** Lire `import { TAX } from '@/constants/tax'` indique immédiatement *d'où* vient cette valeur et *quel domaine* en est propriétaire — pas besoin d'ouvrir le fichier pour le savoir.
- **Ownership et scope de changement clairs.** Un changement sur les règles de livraison ne touche que `shipping.ts`. Les diffs, la code review et le git blame restent pertinents.
- **Plus facile à faire évoluer.** Quand un domaine a besoin de types plus riches (enums, tables de lookup, valeurs dérivées), le fichier existe déjà pour les accueillir.

## Convention personnelle

Cette organisation reflète la façon dont je structure les constantes sur les projets de production — noms de fichiers explicites par domaine, une responsabilité par fichier, importés via un alias (`@/constants/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
