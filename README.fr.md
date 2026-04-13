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

## Limites et améliorations futures

### Ce qui n'a pas été fait (par manque de temps)

- [ ] **Helpers de parsing numérique strict** (`parseIntStrict` / `parseFloatStrict`) — aujourd'hui `parseInt('AAA')` retourne `NaN` et contamine chaque somme en aval silencieusement, exactement comme le legacy. Des helpers qui throw avec le nom du champ fautif viendraient remplacer ça.
- [ ] **Tests unitaires sur la couche orchestration** — `aggregateOrders`, `resolveCustomer`, `buildCustomerReport`, `buildReport`, `writeOutput` sont couverts transitivement par le Golden Master mais n'ont pas de tests dédiés. Risque faible parce que les fonctions composées ont déjà leurs tests, mais utile pour isoler plus finement les régressions.
- [ ] **Validation runtime dans les factories d'IDs brandés** — `toCustomerId`, `toProductId`, etc. ne font qu'un cast pour le moment. Elles sont l'endroit naturel pour brancher des checks de format / longueur / existence ; reporté pour garder l'iso-comportement.
- [ ] **Tests unitaires des parsers sur fixtures en mémoire** — les parsers ne sont testés end-to-end que via le Golden Master. Mocker `fs.readFileSync` avec des strings de fixture isolerait les edge cases de parsing des vraies données.
- [ ] **Sortie d'erreur structurée pour les échecs CLI** — `run()` laisse actuellement les exceptions remonter au handler par défaut du terminal. Un `try/catch` top-level dans `main.ts` qui affiche un message user-friendly et exit avec un code non-zero serait plus propre.

### Compromis assumés

- **Bugs CRLF du legacy reproduits volontairement** — sur Windows, le legacy a trois bugs silencieux causés par `split('\n')` qui laisse un `\r` final sur la dernière colonne de chaque CSV :
    - `taxable === 'true'` est toujours false → la taxe est toujours à zéro.
    - `currency === 'USD'` est toujours false → le taux de conversion reste à 1.0 pour USD / GBP.
    - La valeur de devise polluée est affichée telle quelle, le `\r` final étant absorbé par le séparateur de ligne.

    Justification : le Golden Master doit matcher caractère par caractère sur Windows. Corriger le parser ferait diverger la sortie refactorée de la référence capturée. Les bugs sont reproduits volontairement et listés ici pour qu'une itération future puisse les traiter en même temps qu'un golden mis à jour.

- **Promotion FIXED appliquée par ligne** — le legacy multiplie une remise forfaitaire par `order.qty`, ce qui n'est presque certainement pas l'intention. Préservé pour matcher la sortie legacy.

- **Réduction proportionnelle du plafond de remise** — quand `volumeDiscount + loyaltyDiscount > MAX_DISCOUNT`, les deux sont réduits proportionnellement. Règle métier inhabituelle ; conservée telle quelle parce que la modifier changerait le breakdown affiché.

- **Bonus weekend basé uniquement sur la date de la première commande** — les clients multi-jours gagnent toujours le multiplicateur basé sur leur première commande, ce qui est surprenant. Préservé.

- **Grand Total labellisé en EUR toutes devises confondues** — les totaux par client sont déjà convertis dans leur devise cible, donc les sommer dans `Grand Total` et labelliser le résultat "EUR" mélange les unités. Préservé.

- **Taux de change codés en dur** — `CURRENCY_RATES` est une table statique dans le code (EUR=1.0, USD=1.1, GBP=0.85). Les vrais taux varient intra-day et les taux historiques ne sont pas conservés, donc rejouer une commande passée avec la table actuelle en réécrit silencieusement la valeur. Un client qui paie dans une devise non listée (BRL, JPY, CHF…) tombe sur le taux 1.0 sans aucun warning. Préservé parce que le legacy se comporte pareil.

- **Gestion des dates et heures sensible à la timezone** — `new Date('2025-01-15').getDay()` retourne le jour de la semaine dans la **timezone locale de la machine qui exécute le script**. Les mêmes données traitées sur un serveur à Tokyo (UTC+9) et à Paris (UTC+1) peuvent produire des bonus weekend différents près de minuit UTC. De même, `parseHour('09:15')` extrait une heure sans timezone attachée, donc la règle "bonus matinal avant 10:00" est ambiguë pour les clients d'autres régions. Préservé parce que le legacy a le même problème ; le fix consiste à choisir une timezone de référence explicite (UTC, locale du client ou locale du business) et à l'imposer partout.

- **Aucune validation des dates CSV** — `new Date('pas-une-date')` retourne `Invalid Date`, `getDay()` retourne `NaN`, et `NaN === 0 || NaN === 6` vaut `false`, donc une mauvaise date skippe silencieusement le bonus weekend sans aucun warning. Une typo dans le CSV (par exemple `2025-13-45`) passe inaperçue.

- **Montants monétaires stockés en `number` JavaScript (float64)** — chaque total, remise, taxe et frais de livraison s'accumule en floats IEEE-754. Le classique `0.1 + 0.2 !== 0.3` est latent partout : sur de gros batchs, les centimes peuvent dériver et le total affiché peut être à quelques centimes près de la somme de ses composants. Le fix est simple : quelques helpers qui convertissent vers des unités mineures entières (centimes) pour l'arithmétique, puis reconvertissent en décimal pour l'affichage — aucune dépendance externe nécessaire. Préservé pour matcher le legacy.

- **Les clients sans commande sont invisibles** — le rapport boucle sur les clients *qui ont commandé*, donc un client présent dans `customers.csv` mais sans entrée dans `orders.csv` n'apparaît jamais dans la sortie. C'est le comportement legacy et c'est peut-être voulu, mais ça mérite d'être confirmé avec le business avant de considérer le rapport comme une liste exhaustive de clients.

- **Split CSV naïf (sans escaping)** — notre `readCsv` découpe les lignes sur un `,` littéral. Une valeur contenant une virgule (`"Smith, John"`) ou un saut de ligne embarqué corromprait toutes les colonnes suivantes. Ça marche aujourd'hui parce que les données actuelles n'en contiennent pas, mais une simple édition d'un nom de client peut casser tout le pipeline. Le vrai fix, c'est une vraie librairie CSV.

- **Encodage UTF-8 imposé en dur** — `fs.readFileSync(path, 'utf-8')` corrompt silencieusement tout CSV exporté dans un autre encodage (Latin-1, Windows-1252, exports Excel français avec accents…). Aucune détection de BOM, aucun encodage configurable, aucun warning quand une ligne contient des caractères de remplacement.

- **Un seul `console.info(reportText)` pour le rapport texte** — garde le comportement legacy (le shell capture stdout). Un vrai CLI distinguerait stdout (payload) de stderr (logs).

### Pistes d'amélioration future

- Remplacer le lecteur CSV artisanal par une librairie standard (`csv-parse`) — le seul cas où les règles RFC 4180 (quoting, échappement, newlines embarqués) sont assez complexes pour qu'un parser fait main ne vaille pas le coup.
- Alimenter `CURRENCY_RATES` depuis un provider externe (API, cache, snapshots quotidiens) avec une table historique pour que les commandes passées puissent être rejouées avec le taux de leur propre date. Le wrapper `getCurrencyRate` est déjà en place donc les call sites ne changeront pas.
- Introduire une timezone business explicite (par exemple `Europe/Paris`) et dériver `getDay()` / `parseHour` depuis elle via le `Intl.DateTimeFormat` natif de Node — un helper de ~10 lignes (`new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })`) suffit, aucune lib de date nécessaire.
- Introduire un petit helper monétaire (`toCents(value) = Math.round(value * 100)` / `fromCents(cents) = cents / 100`) et faire toutes les accumulations en centimes entiers pour tuer la dérive flottante. Pareil, aucune dépendance externe pour les opérations actuelles (addition, soustraction, multiplication par un entier).
- Valider les strings de date CSV à l'étape de parsing (format + réalité), fallback ou throw sur date invalide au lieu de produire silencieusement `NaN`.
- Étendre l'union `Currency` (ou la rendre dynamique depuis le rates provider) pour qu'un CSV contenant une devise non listée soit soit rejeté en amont soit géré proprement.
- Extraire un `src/domain/` pour des policies métier plus riches si les règles dépassent le pur calcul (validation, workflows, règles d'éligibilité).
- Migrer vers ESM une fois que le tooling (ts-node / Jest) est stable, pour remplacer `require.main === module` par une détection d'entrée plus propre.
- Ajouter un flag `--dry-run` sur `pnpm start` pour ne pas écrire `output.json` (utile pour les checks CI et la preview).
- Ajouter un seuil de couverture sur Jest (`--coverage --coverageThreshold=...`) une fois les tests orchestration en place.
