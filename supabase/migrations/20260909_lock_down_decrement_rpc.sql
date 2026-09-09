-- Faille CRITIQUE confirmée par test d'intrusion (09/09/2026) : la RPC
-- decrement_product_quantity est SECURITY DEFINER, donc contourne RLS par
-- conception — mais Postgres accorde EXECUTE à PUBLIC par défaut sur toute
-- nouvelle fonction, et aucun REVOKE n'avait jamais été appliqué. N'importe
-- qui muni de la seule clé anonyme (publique, présente dans le bundle JS du
-- site) pouvait donc appeler cette RPC directement via PostgREST et
-- décrémenter/vendre un produit à volonté, sans passer par Stripe.
--
-- Test réalisé : appel anonyme sur le produit "Test 81444"
-- (prod_UoPxBRkdk58ttW) -> quantity passé de 1 à 0, status de 'available' à
-- 'sold'. Donnée restaurée manuellement après le test.
--
-- Seul le webhook stripe-webhook (clé service_role) a besoin d'appeler cette
-- fonction ; on retire donc l'accès à anon/authenticated/PUBLIC.
REVOKE EXECUTE ON FUNCTION decrement_product_quantity(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_quantity(TEXT) TO service_role;
