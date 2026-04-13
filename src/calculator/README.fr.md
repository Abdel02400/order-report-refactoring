# `src/calculator/`

> Version anglaise disponible ici : [README.md](README.md).

Ce dossier regroupe la logique métier pure de l'application — toutes les règles qui transforment les entités typées en chiffres et décisions qui forment le rapport final.

## Objectif

Isoler la partie "réflexion" de l'application de la partie "action". Les parsers gèrent les entrées, la couche report gère les sorties, et ce dossier possède les règles au milieu : comment un line total est calculé, comment les promotions sont résolues, comment les remises sont plafonnées, comment le shipping évolue avec le poids, comment les taxes sont appliquées, etc.

Chaque fonction ici est **pure** : elle prend des entrées typées, retourne un résultat, et ne touche jamais à l'I/O, aux globals ou à l'état partagé. Ça rend la logique triviale à tester, sûre à réutiliser dans différents contextes (CLI, API, worker…) et facile à raisonner quand on debug la sortie d'un client ou d'une commande spécifique.

## Organisation des fichiers

La logique est regroupée par **sous-domaine métier**, chacun dans son propre dossier. Dans un dossier, un fichier par concern :

- [currency/currency.ts](currency/currency.ts) — `getCurrencyRate`
- [pricing/](pricing/) — pricing au niveau ligne
    - [promotion.ts](pricing/promotion.ts) — `resolvePromotion` (PERCENTAGE vs FIXED, check d'activité, early returns)
    - [lineTotal.ts](pricing/lineTotal.ts) — `computeLineTotal` (prix de base, application promo, morning bonus)
- [discount/](discount/) — remises au niveau client
    - [volume.ts](discount/volume.ts) — `computeVolumeDiscount` (paliers via `switch (true)`, bonus weekend)
    - [loyalty.ts](discount/loyalty.ts) — `computeLoyaltyPoints`, `computeLoyaltyDiscount`
    - [cap.ts](discount/cap.ts) — `capDiscount` (plafond global MAX_DISCOUNT, réduction proportionnelle)
- [tax/tax.ts](tax/tax.ts) — `computeTax` (logique taxable globale vs par ligne)
- [shipping/](shipping/) — frais de livraison et manutention
    - [shipping.ts](shipping/shipping.ts) — `computeShipping` (dispatch via `switch (true)` ; helper interne `computePaidShipping` pour les paliers de poids et les zones lointaines)
    - [handling.ts](shipping/handling.ts) — `computeHandling` (paliers via `switch (true)`)

### Pourquoi des sous-dossiers par sous-domaine

- **Scalabilité.** Chaque sous-domaine métier fait évoluer ses propres règles, edge cases et helpers. Les sous-dossiers empêchent `calculator/` de devenir un dump plat de 15+ fichiers.
- **Les chemins explicites servent de doc.** `import { computeShipping } from '@/calculator/shipping/shipping'` rend le contexte métier immédiatement visible dans l'import.
- **Ownership et scope de changement clairs.** Un changement sur les règles de livraison ne touche que `shipping/`. Diffs, code review et git blame restent pertinents.
- **Plus facile à faire évoluer.** Quand un sous-domaine a besoin d'une logique plus riche (strategy pattern, rule registry, variantes supplémentaires), son dossier existe déjà pour accueillir les fichiers supplémentaires.

## Pourquoi le dossier s'appelle `calculator/`

Toute la couche métier de cette application est du calcul : prix, taxes, remises, livraison, totaux. `calculator/` l'annonce directement, ce qui se lit plus vite que le `domain/` plus abstrait quand on ouvre le repo pour la première fois. Les mêmes conventions s'appliquent — fonctions pures, constantes extraites, sous-dossiers par sujet métier.

## Notes de design

- **Fonctions pures uniquement.** Pas de `fs`, pas de `console`, pas de globals. Les entrées arrivent en arguments, les résultats sortent en return. Orchestration et I/O vivent ailleurs.
- **Une responsabilité par fichier.** `volume.ts` calcule uniquement la remise volume, `cap.ts` applique uniquement le plafond global, `handling.ts` calcule uniquement les frais de manutention. La composition se fait dans l'orchestrateur (`src/main.ts`).
- **Les constantes sont importées, jamais inline.** Chaque seuil, taux, multiplicateur et zéro nommé (`NO_HANDLING`, `NO_LOYALTY_DISCOUNT`, `NO_MORNING_BONUS`, `NO_SHIPPING`, `NO_TAX`, `NO_VOLUME_DISCOUNT`, `NO_DISCOUNT_RATE`, `NO_FIXED_DISCOUNT`) vit dans `src/constants/` et est importé ici par son nom. Aucun magic number ne survit dans le code métier.
- **On utilise des unions fermées, pas des strings littérales.** Les checks comme `level === CUSTOMER_LEVEL.PREMIUM`, `promo.type === PROMOTION_TYPE.PERCENTAGE`, `WEEKEND_DAYS.includes(dayOfWeek)` passent par les constantes typées définies dans `src/types/`. Une typo devient une erreur à la compilation.
- **`switch (true)` pour les règles en paliers.** Là où le legacy utilisait une chaîne de `if (subtotal > X)` qui s'écrasent, le refacto utilise `switch (true)` avec le cas le plus strict en premier et `break`/`return`. Le comportement est préservé (le palier le plus élevé atteint gagne) tout en rendant la structure des paliers lisible d'un coup d'œil.
- **Les helpers privés restent locaux au fichier.** Les helpers internes utilisés par une seule fonction (par exemple `computePaidShipping` dans `shipping/shipping.ts`) **ne sont pas exportés** pour que la surface publique du sous-domaine reste intentionnelle.
- **Le comportement est préservé, pas "amélioré".** L'objectif de ce refacto est de garder la sortie du legacy caractère par caractère. Les quirks connus du legacy (promo FIXED appliquée par ligne, propagation NaN silencieuse sur mauvaises entrées numériques, plafond proportionnel, bonus weekend dérivé de la date de la première commande…) sont conservés intentionnellement. Ils sont documentés comme dette technique à traiter plus tard, une fois que le golden master verrouille le comportement actuel.
- **Wrappers fins temporaires conservés volontairement.** `getCurrencyRate` est un lookup d'une ligne aujourd'hui. Il est conservé comme verbe du domaine (avec JSDoc expliquant l'intention) pour que la table de devises codée en dur puisse être remplacée plus tard par un vrai provider (API, cache, dates historiques) sans toucher aux call sites.

## Convention personnelle

Cette organisation reflète la façon dont je structure la couche métier sur les projets de production — sous-dossiers par sous-domaine métier, une responsabilité par fichier, fonctions pures, constantes extraites, unions fermées plutôt que strings littérales, `switch (true)` pour les règles en paliers, JSDoc sur les helpers non-évidents, importés via un alias (`@/calculator/...`). L'objectif est d'écrire aujourd'hui le code que j'écrirais sur une codebase qui doit vivre des années.
