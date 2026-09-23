-- Anticipe un changement annoncé par Supabase (email du 23/09/2026) : à
-- partir du 30 octobre 2026, les nouvelles tables du schéma public ne
-- recevront plus automatiquement de droits d'accès Data API. Sans GRANT
-- explicite, la table devient injoignable via l'API REST — y compris pour
-- un nouveau projet, une preview branch, ou un "supabase db reset" qui
-- rejoue ce script depuis zéro.
--
-- Concerne uniquement les tables créées par nos propres migrations
-- (orders, contact_requests, push_subscriptions, site_content,
-- analytics_events). "products" et "reviews" préexistaient dans le projet
-- avant cette migration history et conservent leurs droits actuels.
--
-- Les droits accordés ici reflètent strictement ce que permettent déjà les
-- policies RLS de chaque table (le GRANT est la limite externe, RLS
-- affine ensuite) — pas un copier-coller générique.

-- orders : aucune policy anon (table jamais censée être touchée par un
-- visiteur), on ne lui accorde donc rien.
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO service_role;

-- contact_requests : INSERT ouvert à tous (formulaire de contact),
-- lecture/gestion réservée aux comptes connectés.
GRANT INSERT ON public.contact_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_requests TO service_role;

-- push_subscriptions : INSERT ouvert (abonnement notifications),
-- lecture/gestion réservée aux comptes connectés.
GRANT INSERT ON public.push_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;

-- site_content : lecture publique, édition réservée aux comptes connectés.
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO service_role;

-- analytics_events : INSERT ouvert (tracking visiteur), lecture/suppression
-- réservées aux comptes connectés (pas d'UPDATE : événements immuables).
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO service_role;
