-- ============================================================
-- Durcissement RLS suite à l'audit sécurité du 2026-09-09.
--
-- La table "products" a été créée directement depuis l'interface Supabase,
-- hors du suivi des migrations (contrairement au reste du projet) — sa
-- policy de lecture publique existante autorisait n'importe qui à lire
-- TOUS les articles (vendus, archivés, tests...) via un accès direct à
-- l'API, en contournant le filtre "status = available" appliqué seulement
-- côté client sur la page "Pièces disponibles". On la remplace ici par une
-- policy équivalente mais correctement scopée, et on la fait enfin entrer
-- dans le suivi de version.
-- ============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Supprime toute policy de lecture existante sur products, quel que soit
-- son nom (créée à la main dans Supabase Studio, donc inconnue ici) —
-- idempotent et sans risque : on la recrée juste après, correctement scopée.
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
