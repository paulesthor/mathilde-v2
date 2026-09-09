-- Activez la décrémentation atomique de la quantité de produit lors d'un achat.
-- À exécuter dans l'éditeur SQL de votre tableau de bord Supabase (https://supabase.com/dashboard).

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
-- PUBLIC par défaut sur toute nouvelle fonction, donc sans ce REVOKE, n'importe
-- qui avec la seule clé anonyme peut appeler cette RPC directement (sans passer
-- par le webhook Stripe) et décrémenter/vendre un produit à volonté.
-- Seul le webhook stripe-webhook (clé service_role) doit pouvoir l'appeler.
REVOKE EXECUTE ON FUNCTION decrement_product_quantity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_quantity(TEXT) TO service_role;
