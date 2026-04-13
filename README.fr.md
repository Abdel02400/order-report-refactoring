# Refactoring du rapport de commandes

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" />
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
</p>

> Version anglaise disponible ici : [README.md](README.md).

## Installation

### Prérequis

- Node.js version 20.x ou supérieure
- pnpm version 8.x ou supérieure

### Commandes

```bash
# Installer les dépendances
pnpm install

# Linter le code
pnpm lint

# Formater le code
pnpm format
```

## Exécution

### Lancer le code refactoré

```bash
# Lancer le rapport refactoré
pnpm start

# Lancer le script legacy (conservé pour la comparaison Golden Master)
pnpm legacy
```

### Lancer les tests

```bash
# Tests unitaires d'abord, puis le Golden Master end-to-end
# (le Golden Master ne tourne que si tous les tests unitaires sont verts)
pnpm test

# Uniquement les tests unitaires (rapide — pas d'execSync)
pnpm test:unit

# Uniquement le Golden Master
pnpm test:golden
```

## Choix de refactoring

### Problèmes identifiés dans le legacy

1. **Fonction monolithique** — `run()` dans [legacy/orderReportLegacy.ts](legacy/orderReportLegacy.ts) fait ~350 lignes et gère parsing CSV, règles métier, formatage et I/O en même temps.
    - Impact : rien n'est testable unitairement ; toute modification peut casser autre chose.

2. **Absence de vrai typage** — `type Customer = any`, `type Order = any`, `type Product = any`, `type ShippingZone = any`, `type Promotion = any`.
    - Impact : TypeScript n'apporte aucune protection ; les fautes de frappe sur les noms de champs échouent silencieusement au runtime.

3. **Parsing CSV dupliqué** — le découpage de lignes, la gestion des headers et l'extraction des champs sont réécrits cinq fois avec de petites variations.
    - Impact : cinq endroits à modifier quand le format CSV évolue, cinq risques de divergence.

4. **Magic numbers partout** — `0.2`, `50`, `0.3`, `1.2`, `1.05`, `200`, `0.01`, seuils, paliers de poids, multiplicateurs de livraison, taux de bonus matinal, taux de change, tout codé en dur sans nom.
    - Impact : illisible, non-greppable, non-testable, impossible à changer en sécurité.

5. **Règles cachées dans le pipeline** — bonus matinal basé sur l'heure, bonus weekend basé sur la date de la première commande, majoration sur des zones lointaines spécifiques, plafond proportionnel quand la remise totale dépasse la limite globale.
    - Impact : ces règles ne se découvrent qu'en lisant toute la fonction de haut en bas.

6. **Comparaisons à des strings littérales** — `currency === 'USD'`, `level === 'PREMIUM'`, `promo.type === 'PERCENTAGE'` répétés dans tout le code.
    - Impact : renommer `'PREMIUM'` implique de toucher chaque fichier qui le compare.

7. **`try/catch` silencieux** — les lignes invalides sont ignorées avec un `continue` sans aucun log.
    - Impact : les problèmes de qualité de donnée n'émergent jamais ; le rapport est produit à partir d'un sous-ensemble que personne ne remarque.

8. **Bugs de parsing CSV sur Windows (CRLF)** — le script utilisant `split('\n')`, le `\r` de fin pollue la dernière colonne de chaque CSV. Trois conséquences sont inscrites dans la sortie actuelle :
    - `taxable === 'true'` est toujours `false` → la taxe est toujours à zéro.
    - `currency === 'USD'` est toujours `false` → le taux de change reste à 1.0 pour USD et GBP.
    - La valeur de la devise polluée est affichée telle quelle ; le `\r` final n'est invisible que parce qu'il est absorbé par le `\n` final de chaque ligne.
    - Impact : sortie numériquement fausse, incohérente avec le label de devise affiché.

9. **I/O mélangé avec les calculs** — la fonction affiche sur la console et écrit `output.json` au milieu de la boucle d'agrégation.
    - Impact : impossible de réutiliser la logique dans une API, un worker ou un test sans déclencher les effets de bord.

10. **IDs non typés** — `customer_id`, `product_id`, `promo_code` sont de simples `string`. Passer un `ProductId` là où un `CustomerId` est attendu compile sans erreur.
    - Impact : bugs silencieux d'inversion d'IDs.

### Solutions apportées

1. **Découpage de la fonction unique en couches** — `parsers/`, `calculator/`, `orchestration/`, `report/`, `utils/`.
    - Justification : chaque couche a un contrat entrée/sortie clair ; seule l'orchestration connaît toutes les autres.

2. **IDs "brandés" avec factory helpers** (`CustomerId`, `ProductId`, `OrderId`, `PromotionCode`) créés via des fonctions type `toCustomerId(value)`.
    - Justification : protection au niveau du type contre les inversions d'ID, et un seul endroit pour brancher de la validation runtime plus tard.

3. **Unions fermées pour les valeurs finies** (`CUSTOMER_LEVEL`, `CURRENCY`, `PROMOTION_TYPE`, `SHIPPING_ZONE`) via le pattern `const object + typeof + keyof`, associées à un tableau runtime `*_CODES` / `*_LEVELS` branché sur `parseEnum`.
    - Justification : une seule source de vérité pour les valeurs acceptées, validation runtime à la frontière I/O, autocomplétion dans l'IDE, renommage à un seul endroit.

4. **Lecteur CSV générique typé** — `readCsv<T extends CsvRow>(fileKey)` avec des interfaces `*CsvRow` par entité.
    - Justification : une typo dans un accès de champ devient une erreur à la compilation ; les cinq blocs de parsing dupliqués deviennent un seul.

5. **Clés de fichiers CSV typées** — les parsers référencent `CSV_FILE.CUSTOMERS` plutôt que le littéral `'customers'`.
    - Justification : protégé contre les typos, discoverable via autocomplétion, conforme à la convention `SHIPPING_ZONE.ZONE_3` utilisée ailleurs.

6. **Tous les magic numbers extraits dans `@/constants/*`** — zéros nommés (`NO_TAX`, `NO_HANDLING`, `NO_SHIPPING`, `NO_VOLUME_DISCOUNT`, `NO_LOYALTY_DISCOUNT`, `NO_MORNING_BONUS`, `NO_DISCOUNT_RATE`, `NO_FIXED_DISCOUNT`, `NO_GRAND_TOTAL`, `NO_TAX_COLLECTED`, `NO_SUBTOTAL`, `NO_WEIGHT`, `NO_LOYALTY_POINTS`) et valeurs par défaut (`DEFAULT_PRODUCT_WEIGHT`, `DEFAULT_ORDER_TIME`, `DEFAULT_ZONE_PER_KG`, `DEFAULT_CURRENCY_RATE`, `DEFAULT_CUSTOMER_NAME`, `FULL_PRICE_FACTOR`, `PERCENT_BASE`).
    - Justification : code lisible, valeurs greppables, un seul endroit pour changer une règle.

7. **`switch (true)` pour les règles en paliers** — volume discount, loyalty discount, handling fee, shipping cost utilisent tous `switch (true)` avec le cas le plus strict en premier.
    - Justification : préserve exactement le comportement du legacy (le palier le plus élevé atteint gagne) tout en rendant la structure des paliers lisible d'un coup d'œil.

8. **Calculators en fonctions pures** — `src/calculator/` ne contient que des fonctions pures avec entrées/sorties typées. Pas de `fs`, pas de `console`, aucun état global.
    - Justification : chaque règle est testable unitairement en isolation ; la couche d'orchestration les compose.

9. **I/O isolé aux extrémités** — les parsers lisent les fichiers, `writeOutput` écrit `output.json` et imprime, tout ce qu'il y a entre les deux reste pur.
    - Justification : une future route API, un worker ou un scheduler peut appeler `buildReport()` sans aucun effet de bord.

10. **Bugs CRLF documentés et préservés par iso-comportement** — les trois bugs CRLF spécifiques à Windows sont reproduits volontairement pour que le Golden Master matche caractère par caractère. Listés dans la section dette technique plus bas.

11. **Suite complète Golden Master + tests unitaires** — `tests/golden.master.test.ts` lance `pnpm legacy` et `pnpm start` puis compare les sorties caractère par caractère ; 15 fichiers `*.test.ts` co-localisés couvrent chaque fonction pure et chaque cas limite.
    - Justification : empêche les régressions pendant le refacto et verrouille le comportement actuel avant toute correction de bug.

### Architecture

Six couches, chacune avec une responsabilité unique :

```
┌─────────────┐   Lit les CSV en entités typées
│   parsers/  │   readCsv<T>, parseCustomers, parseOrders, etc.
└──────┬──────┘
       │
┌──────▼───────┐  Règles métier pures sur entités typées
│  calculator/ │  pricing, discount, tax, shipping, currency
└──────┬───────┘
       │
┌──────▼──────────┐  Glue — agrégation des commandes, résolution
│  orchestration/ │  du client, DTO par client, rapport, écriture
└──────┬──────────┘  sortie
       │
┌──────▼──────┐   DTO → string / JSON
│   report/   │   formatter, jsonExport, helpers de format
└─────────────┘
```

Dossiers transverses :

- **`types/`** — formes des entités (`Customer`, `Order`, `Product`…), IDs brandés, unions fermées (`SHIPPING_ZONE`, `CURRENCY`…), DTOs du rapport.
- **`constants/`** — chaque magic number sous un nom explicite, regroupé par domaine métier.
- **`utils/`** — helpers techniques sans connaissance métier (`round2`, `parseHour`, `parseEnum`, `parseBool`, `csvFileExists`, `typedKeys`).
- **`tests/`** — co-localisés sous chaque dossier concerné pour les tests unitaires ; le Golden Master end-to-end est à la racine.

Flux de données :

1. `main.run()` appelle `buildReport()`.
2. `buildReport()` parse les cinq CSV.
3. `aggregateOrders()` parcourt chaque commande, applique les règles de promotion et de line total, et construit un agrégat par client.
4. Pour chaque customer id (trié), `buildCustomerReport()` résout le client, exécute le pipeline discount → cap → tax → shipping → handling → currency et retourne un DTO `CustomerReportData`.
5. `buildReport()` somme `grandTotal` et `totalTaxCollected` depuis la liste des DTOs et retourne un `ReportData`.
6. `formatReport()` transforme le `ReportData` en la sortie texte exacte du legacy ; `buildJsonExport()` produit le payload snake_case pour `output.json`.
7. `writeOutput()` écrit le JSON sur disque et affiche le rapport via `console.info`.

### Exemples concrets

**Exemple 1 — règle de remise par paliers**

- **Problème** : le legacy utilisait quatre `if` séquentiels qui écrasaient chacun la valeur `disc` précédente. Facile de rater que le palier le plus strict atteint est celui qui gagne.

    ```ts
    // legacy
    let disc = 0.0;
    if (sub > 50) disc = sub * 0.05;
    if (sub > 100) disc = sub * 0.1;
    if (sub > 500) disc = sub * 0.15;
    if (sub > 1000 && level === 'PREMIUM') disc = sub * 0.2;
    ```

- **Solution** : `switch (true)` avec le cas le plus strict en premier, `break` rapide, constantes nommées, comparaison à une union fermée.

    ```ts
    // src/calculator/discount/volume.ts
    switch (true) {
        case subtotal > VOLUME_TIER_PREMIUM_MIN && level === CUSTOMER_LEVEL.PREMIUM:
            disc = subtotal * VOLUME_TIER_PREMIUM_RATE;
            break;
        case subtotal > VOLUME_TIER_3_MIN:
            disc = subtotal * VOLUME_TIER_3_RATE;
            break;
        case subtotal > VOLUME_TIER_2_MIN:
            disc = subtotal * VOLUME_TIER_2_RATE;
            break;
        case subtotal > VOLUME_TIER_1_MIN:
            disc = subtotal * VOLUME_TIER_1_RATE;
            break;
        default:
            disc = NO_VOLUME_DISCOUNT;
    }
    ```

**Exemple 2 — parsing CSV**

- **Problème** : les mêmes ~10 lignes de split, filter et accès positionnel étaient répétées pour chaque CSV. Une typo sur `parts[4]` vs `parts[5]` échouait silencieusement.
- **Solution** : un seul `readCsv<T>(fileKey)` générique qui retourne des lignes typées, clefées par nom de header. Chaque parser d'entité déclare une interface `*CsvRow` donc les typos de champ sont détectées à la compilation.

    ```ts
    // src/parsers/customer.ts
    interface CustomerCsvRow extends CsvRow {
        id: string;
        name: string;
        level: string;
        shipping_zone: string;
        currency: string;
    }

    const rows = readCsv<CustomerCsvRow>(CSV_FILE.CUSTOMERS);
    ```

**Exemple 3 — IDs**

- **Problème** : `customer_id`, `product_id`, `promo_code` étaient de simples `string`. Un ID mal utilisé compilait bien et produisait une sortie fausse mais silencieuse.
- **Solution** : types brandés + factory helpers.

    ```ts
    // src/types/customer.ts
    export type CustomerId = string & { readonly __brand: 'CustomerId' };
    export const toCustomerId = (value: string): CustomerId => value as CustomerId;

    // à la frontière I/O
    const id = toCustomerId(row.id);
    ```

**Exemple 4 — isolation I/O**

- **Problème** : `console.log` et `fs.writeFileSync` vivent au milieu de la boucle de calcul.
- **Solution** : les calculs retournent des DTOs, un seul `writeOutput(text, json)` à la fin exécute les effets de bord. `buildReport()` lui-même n'a aucun effet de bord et peut être appelé depuis un test, un worker ou une API.

## Dette technique identifiée

Le refacto préserve la sortie du legacy caractère par caractère, bugs inclus. Problèmes connus à traiter dans une itération ultérieure :

1. **Bugs CRLF de parsing sur Windows** — `taxable` est toujours false, le taux de change toujours 1.0, la valeur de devise porte un `\r` final. Une vraie librairie CSV (ou `split(/\r?\n/)`) corrige les trois. Correction reportée car elle divergerait de la sortie legacy actuelle.

2. **Parsing numérique silencieux** — `parseInt('AAA')` retourne `NaN` et contamine silencieusement chaque somme en aval. À remplacer par des helpers `parseIntStrict` / `parseFloatStrict` qui throw avec le nom du champ fautif.

3. **Taux de change codés en dur** — `CURRENCY_RATES` est une table statique. Un vrai système devrait récupérer les taux via une API ou une config, avec un historique par jour. Le wrapper `getCurrencyRate` est intentionnellement conservé pour que les call sites n'aient pas à changer quand le backing store évolue.

4. **Promotion FIXED appliquée par ligne** — le legacy multiplie une promotion forfaitaire par la quantité de la commande, ce qui n'est presque certainement pas l'intention.

5. **Réduction proportionnelle sur le plafond volume discount** — quand `volume + loyalty > MAX_DISCOUNT`, les deux sont mis à l'échelle proportionnellement. Règle métier inhabituelle ; à confirmer avec les stakeholders.

6. **Bonus weekend basé sur la date de la première commande** — seule la date du premier article pilote le multiplicateur, ce qui est surprenant pour un client qui commande sur plusieurs jours.

7. **Grand Total labellisé en EUR quelle que soit la devise** — les totaux par client peuvent être en EUR, USD ou GBP mais la ligne `Grand Total` les mélange en affichant "EUR".
