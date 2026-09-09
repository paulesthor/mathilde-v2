-- ============================================================
-- Script consolidé et idempotent (rejouable sans risque) —
-- utilisé par le workflow GitHub Actions de déploiement.
-- Regroupe toutes les migrations existantes + la création du
-- bucket de stockage "products".
-- ============================================================

-- 1. Table des commandes (orders_setup.sql)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address JSONB,
    amount_total NUMERIC(10, 2),
    product_title TEXT,
    stripe_product_id TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON public.orders;
CREATE POLICY "Allow authenticated users to read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

-- 2. Décrément atomique du stock (decrement_product_quantity.sql)
CREATE OR REPLACE FUNCTION decrement_product_quantity(p_stripe_product_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET quantity = GREATEST(0, COALESCE(quantity, 1) - 1),
      status = CASE WHEN COALESCE(quantity, 1) - 1 <= 0 THEN 'sold' ELSE 'available' END
  WHERE stripe_product_id = p_stripe_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER contourne RLS par conception : Postgres accorde EXECUTE à
-- PUBLIC par défaut, donc sans ce REVOKE, n'importe qui avec la seule clé
-- anonyme peut appeler cette RPC directement et décrémenter/vendre un produit
-- sans passer par le webhook Stripe. Seul stripe-webhook (service_role) l'appelle.
REVOKE EXECUTE ON FUNCTION decrement_product_quantity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_quantity(TEXT) TO service_role;

-- 3. Demandes de contact / devis (20260629_contact_requests.sql)
CREATE TABLE IF NOT EXISTS contact_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   text        NOT NULL,
  last_name    text        NOT NULL,
  email        text        NOT NULL,
  phone        text,
  message      text        NOT NULL,
  status       text        NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'read', 'replied')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert contact requests" ON contact_requests;
CREATE POLICY "Public insert contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read contact requests" ON contact_requests;
CREATE POLICY "Admin read contact requests"
  ON contact_requests FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update contact request status" ON contact_requests;
CREATE POLICY "Admin update contact request status"
  ON contact_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete contact requests" ON contact_requests;
CREATE POLICY "Admin delete contact requests"
  ON contact_requests FOR DELETE
  USING (auth.role() = 'authenticated');

-- 4. Abonnements aux notifications push (20260629_push_subscriptions.sql)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON push_subscriptions;
CREATE POLICY "Anyone can subscribe"
  ON push_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read subscriptions" ON push_subscriptions;
CREATE POLICY "Admin read subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete subscriptions" ON push_subscriptions;
CREATE POLICY "Admin delete subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Préférences de notifications (20260701_notification_preferences.sql)
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS notify_orders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_contacts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_reviews boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Admin update subscriptions" ON push_subscriptions;
CREATE POLICY "Admin update subscriptions"
  ON push_subscriptions FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Synchronisation des liens Stripe (20260701_stripe_payment_link_id.sql)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stripe_payment_link_id text;

-- 7. Bucket de stockage "products" (public en lecture)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Contenu éditorial du site pilotable par l'admin (20260727_site_content.sql)
CREATE TABLE IF NOT EXISTS site_content (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page         text        NOT NULL
                           CHECK (page IN ('home', 'about', 'realisations', 'creations', 'prestations', 'contact')),
  section      text        NOT NULL,
  kind         text        NOT NULL DEFAULT 'text'
                           CHECK (kind IN ('text', 'image', 'list_item')),
  title        text,
  text_value   text,
  image_url    text,
  extra        jsonb,
  sort_order   int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_content_singleton_key
  ON site_content (page, section)
  WHERE kind <> 'list_item';

CREATE OR REPLACE FUNCTION set_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_content_set_updated_at ON site_content;
CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION set_site_content_updated_at();

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site content" ON site_content;
CREATE POLICY "Public read site content"
  ON site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert site content" ON site_content;
CREATE POLICY "Admin insert site content"
  ON site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update site content" ON site_content;
CREATE POLICY "Admin update site content"
  ON site_content FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete site content" ON site_content;
CREATE POLICY "Admin delete site content"
  ON site_content FOR DELETE USING (auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site-content bucket" ON storage.objects;
CREATE POLICY "Public read site-content bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-content');

DROP POLICY IF EXISTS "Admin insert site-content bucket" ON storage.objects;
CREATE POLICY "Admin insert site-content bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-content' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update site-content bucket" ON storage.objects;
CREATE POLICY "Admin update site-content bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-content' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete site-content bucket" ON storage.objects;
CREATE POLICY "Admin delete site-content bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-content' AND auth.role() = 'authenticated');

-- Seed des listes existantes : voir supabase/migrations/20260727_site_content.sql
-- (bloc DO idempotent non dupliqué ici pour garder ce script consolidé lisible ;
-- si la table est vide après ce script, exécuter aussi ce fichier de migration).

-- 9. Durcissement RLS "products" (20260909_products_reviews_rls_hardening.sql)
-- La policy de lecture publique créée à la main dans Supabase Studio exposait
-- tous les statuts (vendu, archivé, tests...) via un accès direct à l'API,
-- en contournant le filtre appliqué seulement côté client sur "Pièces
-- disponibles". Remplacée par une policy équivalente mais correctement scopée.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.products', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public read available products, admin reads all"
  ON public.products
  FOR SELECT
  USING (status = 'available' OR auth.role() = 'authenticated');

-- 10. Durcissement RLS "reviews" (20260909_products_reviews_rls_hardening.sql)
-- Faille CRITIQUE : la policy d'INSERT anonyme créée à la main permettait à
-- n'importe qui de poster un faux avis directement en statut "approved",
-- visible immédiatement sur le site, sans authentification ni modération.
-- submit-review (Edge Function) utilise la clé service, qui contourne RLS —
-- aucune policy anonyme n'était donc nécessaire.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.reviews', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admin insert reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 11. Verrouillage RPC "decrement_product_quantity" (20260909_lock_down_decrement_rpc.sql)
-- Faille CRITIQUE confirmée par test : la RPC était appelable directement avec
-- la seule clé anonyme et modifiait réellement le stock (quantity -> 0,
-- status -> 'sold'), permettant à quiconque de rendre indisponible n'importe
-- quel produit sans payer, en contournant totalement Stripe.
REVOKE EXECUTE ON FUNCTION decrement_product_quantity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_quantity(TEXT) TO service_role;
