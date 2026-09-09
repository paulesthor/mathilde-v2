-- Audit complémentaire (09/09/2026) : plusieurs policies existent en base
-- réelle mais n'étaient versionnées nulle part, exactement le même défaut
-- qui a causé les deux failles critiques déjà corrigées (products SELECT,
-- reviews INSERT créées à la main dans Supabase Studio). Aucune des
-- policies ci-dessous n'est exploitable par un anonyme (toutes scopées à
-- "authenticated", et l'auto-inscription est désactivée) — ce fichier ne
-- fait que les rendre reproductibles, sans changer leur comportement.

-- Bucket de stockage "products" (images des pièces) : lecture publique,
-- écriture réservée aux comptes authentifiés.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
CREATE POLICY "Authenticated Insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products')
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

-- Gestion complète (INSERT/UPDATE/DELETE/SELECT admin) des tables
-- "products" et "reviews" par un compte authentifié, utilisée par le
-- panneau d'administration pour l'accès direct à la table (hors RPC/Edge
-- Functions dédiées).
DROP POLICY IF EXISTS "Allow authenticated manage products" ON public.products;
CREATE POLICY "Allow authenticated manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated manage reviews" ON public.reviews;
CREATE POLICY "Allow authenticated manage reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
