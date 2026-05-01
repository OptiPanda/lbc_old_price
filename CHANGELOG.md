# Changelog — LBC Old Price

## [2.3.2.0] — 2026-05-01

### Corrections de bugs

- **Ordre de chargement des scripts** (`manifest.json`) : `common.js` était chargé en dernier, rendant `getOptions()` indisponible au moment où `main.js` l'appelait. Ordre corrigé : `common.js` → `ads.js` → `article.js` → `main.js`.
- **Sélecteur de prix introuvable sur page annonce** (`common.js`) : `element.querySelectorAll()` cherchait `[data-qa-id="adview_price"]` dans `article#grid`, mais cet élément se trouve en dehors de l'article. Ajout d'un fallback `document.querySelector()`.
- **Div `hidden` masquant le prix** (`common.js`) : LeBonCoin enveloppe le bloc prix dans `<div class="custom:block hidden">` sur mobile. La classe `hidden` est maintenant retirée avant l'injection de notre affichage.
- **Contenu effacé par le re-render React** (`main.js`) : nos modifications du DOM déclenchaient une erreur d'hydratation React (erreur #418) qui réinitialisait le DOM. Remplacement de la résolution immédiate par `waitForDomStability()` : attente de 800 ms sans mutation DOM avant d'appliquer les enrichissements.
- **Badge rouge non affiché** (`ads.js`) : le sélecteur `[data-test-id="image"]` a été supprimé par LeBonCoin. Remplacé par `[data-spark-component="carousel"]` avec positionnement sur son élément parent.
- **Prix non affiché sur les cartes liste** (`common.js`) : les sélecteurs `[data-test-id="price"]` et `[data-qa-id="adview_price"]` n'existent plus dans les cartes de résultats. Ajout d'un fallback par recherche du `<p aria-hidden="true">` contenant un montant en euros.
- **Date non affichée sur les cartes liste** (`ads.js`) : le sélecteur `[data-test-id="image"]~div[class^="adcard_"]` ne fonctionne plus. Fallback sur le `<p aria-hidden="true">` du prix comme point d'ancrage.
- **Kilométrage non formaté sur page annonce** (`common.js`, `article.js`) : `enhanceAdMileage` n'était appelé que sur les cartes liste. Ajout de l'appel dans `applyOldPrice4Article`. De plus, `nextSibling` remplacé par `nextElementSibling` (saute les nœuds texte), et le XPath étendu de `p` à `*` pour couvrir tous les types d'éléments. Sur la page annonce, la valeur est dans le div frère du parent du label — ajout du fallback `label.parentElement?.nextElementSibling?.querySelector('p, span')`.

### Améliorations

- **Taille du badge de baisse de prix doublée** (`ads.js`) : `font-size` 11 → 22 px, `padding` 2/8 → 4/16 px, `line-height` 18 → 36 px pour une meilleure lisibilité sur les vignettes.

---

## [2.3.1.0] — 2026-05-01

### Nouvelles fonctionnalités

- **Page d'options** (`popup.html` / `popup.js`) : cliquer sur l'icône de l'extension ouvre un panneau permettant d'activer ou désactiver chaque fonctionnalité indépendamment. Les préférences sont sauvegardées via `chrome.storage.sync`.
- **Badge baisse de prix** : sur les pages de résultats, une pastille rouge affiche le pourcentage de baisse directement sur la vignette de l'annonce. Le seuil minimum (1–50 %) est réglable depuis la page d'options.
- **Historique des prix** : chaque visite sur une page d'annonce enregistre le prix observé (via `chrome.storage.local`). Si plusieurs prix différents ont été relevés au fil du temps, un historique chronologique est affiché sous le prix actuel.
- **Bouton "Copier les infos"** : un bouton discret apparaît sur la page d'annonce et copie dans le presse-papier le titre, l'URL, le prix actuel, l'ancien prix (si applicable) et la date de publication.

### Corrections de bugs

- **Shadowing de variable** (`article.js`) : la boucle `for (element of exist)` écrasait le paramètre `element` de la fonction parente. Corrigé en `for (const el of exist)`.
- **Rechargement de page abusif** (`article.js`) : lors d'une navigation SPA vers une autre annonce, l'extension déclenchait un `location.reload()`. Supprimé — le `postId` courant est simplement mis à jour, ce qui préserve la fluidité de navigation.
- **`setTimeout` fixe de 700 ms** (`main.js`) : l'attente arbitraire avant d'appliquer les enrichissements est remplacée par un `MutationObserver` qui détecte précisément l'apparition des éléments LeBonCoin dans le DOM, avec un délai de secours de 5 secondes.
- **`forEach` ignorant les promesses** (`ads.js`) : `allAdItems.forEach(adItem => applyOldPrice4Ad(adItem))` ne permettait pas d'attendre la résolution des appels asynchrones. Remplacé par `Promise.all([...allAdItems].map(...))` pour un traitement réellement concurrent.
- **Polyfill `browser`/`chrome` fragile** (`background.js`, `common.js`) : le pattern `if (chrome) { browser = chrome; }` modifiait une variable globale sans déclaration et pouvait lever une exception. Remplacé par `const extApi = (typeof browser !== 'undefined') ? browser : chrome` dans chaque contexte d'exécution.
- **Erreur silencieuse sur onglets sans content script** (`background.js`) : `browser.tabs.sendMessage` levait une exception non gérée si l'onglet ne possédait pas de content script. Ajout d'un `.catch(() => {})`.

### Améliorations techniques

- **Cache mémoire API** (`common.js`) : un `Map` en mémoire évite les requêtes redondantes pour un même `adId` au cours de la même session de navigation.
- **`run_at: "document_idle"`** (`manifest.json`) : les content scripts sont désormais injectés une fois le DOM stable, ce qui complète le remplacement du `setTimeout`.
- **Toutes les tailles d'icônes déclarées** (`manifest.json`) : les icônes 16×16, 32×32 et 128×128 (présentes dans `icons/`) sont maintenant référencées dans `action.default_icon` et `icons`, en plus du 48×48 déjà présent.
- **Popup déclarée** (`manifest.json`) : ajout de `"action": { "default_popup": "popup.html" }` pour associer le panneau d'options à l'icône de l'extension dans la barre du navigateur.
- **Permission `storage`** (`manifest.json`) : ajoutée pour permettre l'accès à `chrome.storage.sync` (options) et `chrome.storage.local` (historique des prix).
- **Code mort supprimé** (`article.js`) : le bloc commenté de calcul de kilométrage mensuel (`criteria_monthly_mileage`) a été retiré.

---

## [2.3.0.0] — fork correctif de la v2.2.9

Fork du dépôt original [OptiPanda/lbc_old_price](https://github.com/OptiPanda/lbc_old_price) corrigeant la version 2.2.9.

### Corrections apportées par rapport à la v2.2.9

- **Lecture des données via `__NEXT_DATA__`** : ajout d'une stratégie de lecture directe dans la balise `<script id="__NEXT_DATA__">` du DOM (synchrone, sans injection ni requête réseau) en premier recours, avant de passer à l'interception des appels `fetch`.
- **Injection de `page_context.js` via `src`** : l'injection du script de contexte de page passe désormais par un attribut `src` (autorisé par la CSP de LeBonCoin) plutôt que par un script inline bloqué par la politique de sécurité du site.
- **Cache des annonces interceptées** : `page_context.js` maintient un cache `window.__lbc_cache` alimenté par l'interception de `fetch`, permettant de répondre immédiatement aux navigations SPA sans nouvel appel réseau.
- **Compatibilité Manifest v3** : migration du manifest vers la version 3 (service worker, `web_accessible_resources` avec champ `matches`, suppression des permissions obsolètes).
