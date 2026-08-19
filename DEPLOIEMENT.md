# Checklist avant mise en ligne complète — Atelier Gesta

Ce document liste tout ce qui reste à faire pour passer du site actuel (fonctionnel en développement) à une mise en ligne réelle, avec de vrais paiements et de vrais clients.

## 1. Base de données Supabase — migrations à exécuter

À exécuter dans l'éditeur SQL du dashboard Supabase, dans cet ordre (si ce n'est pas déjà fait) :

- [ ] `supabase/orders_setup.sql` — table des commandes
- [ ] `supabase/decrement_product_quantity.sql` — fonction de décrément atomique du stock
- [ ] `supabase/migrations/20260629_contact_requests.sql` — demandes de devis
- [ ] `supabase/migrations/20260629_push_subscriptions.sql` — abonnements aux notifications
- [ ] `supabase/migrations/20260701_notification_preferences.sql` — préférences de notifications (onglet Réglages)
- [ ] `supabase/migrations/20260701_stripe_payment_link_id.sql` — synchronisation des liens Stripe

Table `products` : à vérifier qu'elle existe déjà avec les colonnes attendues (`title, price, quantity, description, image_url, stripe_payment_link, stripe_payment_link_id, stripe_product_id, status, created_at`) — elle n'a pas de script de création dans ce repo (créée manuellement au démarrage du projet).

- [ ] Créer le bucket de stockage **`products`** (accès public en lecture) pour l'upload des photos depuis l'admin.
- [ ] `supabase/migrations/20260727_site_content.sql` — contenu éditorial (textes/photos) modifiable par la cliente + bucket **`site-content`**

## 2. Comptes & clés à configurer

- [ ] **Stripe** : passer des clés de test (`sk_test_...`) aux clés live (`sk_live_...`) une fois les tests validés
- [ ] **Stripe Webhook** : créer un endpoint dans le dashboard Stripe pointant vers l'URL de la fonction `stripe-webhook` déployée, sur l'événement `checkout.session.completed`, et récupérer le secret de signature
- [ ] **Resend** (envoi d'emails) : créer un compte, vérifier le domaine d'expédition (`gesta-studio.com` ou le domaine réel utilisé) pour éviter que les emails de confirmation finissent en spam
- [ ] **Clés VAPID** (notifications push) : générer une paire avec `npx web-push generate-vapid-keys` si ce n'est pas déjà fait — la clé publique actuelle est en dur dans `AdminLayout`/`usePushSubscription.js`, à garder cohérente avec celle enregistrée côté serveur
- [ ] **Compte admin Supabase Auth** : créer l'utilisateur (email/mot de passe) que la cliente utilisera pour se connecter à `/admin/login`

## 3. Variables d'environnement à renseigner

### Côté site (fichier `.env` / secrets de l'hébergeur)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Ne **jamais** définir `VITE_ENABLE_MOCK=true` en production (bascule tout en mode simulation hors-ligne)

### Côté Edge Functions Supabase (Dashboard → Edge Functions → Secrets)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `CONTACT_NOTIFY_EMAIL` (adresse recevant les notifications de devis — sinon `contact@gesta-studio.com` par défaut)
- [ ] `VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `VAPID_SUBJECT` (ex: `mailto:contact@gesta-studio.com`)

(`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase, pas besoin de les renseigner manuellement.)

## 4. Déploiement des Edge Functions

Toutes les fonctions dans `supabase/functions/` doivent être déployées (`supabase functions deploy <nom>`) :

- [ ] `create-stripe-link`
- [ ] `stripe-webhook`
- [ ] `send-contact-email`
- [ ] `submit-review`
- [ ] `send-push`
- [ ] `update-product`
- [ ] `get-checkout-session` (résumé de commande affiché sur la page de confirmation d'achat)

## 5. Hébergement / domaine

- Le site est actuellement configuré pour **GitHub Pages** sous `/mathilde-v2/` (`vite.config.js` → `base`, `index.html`, `manifest.json`, `robots.txt`, `sitemap.xml`).
- [ ] **Aucune automatisation de déploiement (CI/CD) n'est présente actuellement** — `npm run build` doit être lancé et le contenu de `dist/` publié manuellement, ou une GitHub Action doit être ajoutée pour automatiser ça.
- [ ] Si un nom de domaine personnalisé est utilisé à la place de `paulesthor.github.io`, mettre à jour partout : `base` dans `vite.config.js`, les URLs codées en dur dans `index.html` (`og:url`, `og:image`, JSON-LD), `robots.txt` (ligne `Sitemap:`), `sitemap.xml`, `manifest.json` (`start_url`, `scope`), et `ALLOWED_ORIGINS` dans chaque Edge Function (`supabase/functions/*/index.ts`).

## 6. Contenu à finaliser avant l'ouverture au public

- [ ] Remplacer les photos de démonstration (Unsplash) par les vraies photos des créations (catalogue, réalisations)
- [ ] Vérifier/compléter les Mentions légales et CGV (`/legal`) avec les informations réelles de l'entreprise (SIRET, adresse, etc.)
- [x] Image `og-image.jpg` pour le partage réseaux sociaux — générée (branding du site), à remplacer par une vraie photo si souhaité
- [x] Icônes PWA PNG (192×192 et 512×512) — générées à partir du monogramme, référencées dans `manifest.json` et `index.html`

## 7. Tests à faire avant l'ouverture officielle

- [ ] Achat complet de bout en bout avec une carte de test Stripe (`4242 4242 4242 4242`), puis un vrai petit paiement en mode live avant l'annonce — en vérifiant bien que le client est redirigé sur la page de confirmation du site avec le bon récapitulatif (nécessite que `get-checkout-session` et le nouveau `after_completion` du lien Stripe soient déployés)
- [ ] Réception effective des emails de confirmation client
- [ ] Réception des notifications push sur un vrai téléphone (Android **et** iOS si possible — le comportement diffère)
- [ ] Formulaire de contact/devis (envoi + réception de l'email de notification)
- [ ] Connexion admin avec les vrais identifiants (hors mode simulation)

## 8. Sécurité — derniers points de contrôle

- [x] Vérifier qu'aucun fichier `.env` n'est jamais commité — confirmé (`.gitignore` + historique git audité, aucune clé trouvée)
- [x] Vérifier les policies RLS Supabase sur chaque table — confirmé, RLS activé et policies cohérentes sur `products`, `orders`, `reviews`, `contact_requests`, `push_subscriptions`
- [x] CSP resserré (retrait de `unsafe-inline` sur `script-src`, testé sans régression)
- [x] Dépendances vulnérables corrigées (`react-router-dom`, `vite` — 10 vulnérabilités npm audit résolues)
- [ ] `robots.txt` autorise actuellement l'indexation de tout le site (`Allow: /`) : envisager d'exclure `/admin` par précaution, même si le `HashRouter` limite déjà l'indexation réelle de ces routes par Google

## 9. Page « site indisponible » (en cas de panne)

- Une page statique existe à `https://paulesthor.github.io/mathilde-v2/maintenance.html` (fichier `public/maintenance.html`). Elle ne dépend pas de React/JS : même si tout le reste du site plante (build cassé, panne Supabase qui empêche l'app de démarrer), cette page continue de fonctionner puisqu'elle est servie telle quelle par GitHub Pages.
- En cas de panne visible pour les visiteurs, deux options :
  1. **Rediriger vers cette page directement** — partager le lien `.../maintenance.html` (réseaux sociaux, réponse automatique email) pendant la résolution du problème.
  2. **La mettre à la place de la page d'accueil** — dans le pire des cas (site totalement cassé plus d'une journée), copier son contenu dans `dist/index.html` avant de redéployer sur `gh-pages`, le temps de corriger, puis revenir en arrière.
- Contient un message d'excuse + les coordonnées de contact (email et Instagram) pour que les visiteurs puissent joindre l'atelier en attendant.

## 10. À faire en toute fin de projet (une fois tout stabilisé)

- [ ] **Supprimer ou restreindre le workflow `.github/workflows/run-sql.yml`** — c'est un outil de maintenance ponctuelle qui permet d'exécuter n'importe quelle requête SQL sur la base de production via un déclenchement manuel GitHub. Utile pendant le déploiement initial, mais à retirer une fois que tout est stable pour ne pas laisser cet accès total traîner indéfiniment.
- [ ] Révoquer/faire tourner le token d'accès personnel Supabase utilisé pour le déploiement initial une fois qu'il n'est plus nécessaire.
