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
