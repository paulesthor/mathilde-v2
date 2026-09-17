-- Statistiques légères : visites de pages et consultation de pièces, pour
-- alimenter un nouvel onglet "Stats" dans l'admin (ventes/CA déjà disponibles
-- via la table orders existante).
CREATE TABLE IF NOT EXISTS analytics_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text        NOT NULL CHECK (event_type IN ('page_view', 'product_view')),
  path         text,
  product_id   uuid,
  product_title text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON analytics_events (event_type);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Écriture ouverte (comme contact_requests / push_subscriptions) : un visiteur
-- anonyme doit pouvoir enregistrer sa propre visite sans être connecté.
DROP POLICY IF EXISTS "Public insert analytics events" ON analytics_events;
CREATE POLICY "Public insert analytics events"
  ON analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read analytics events" ON analytics_events;
CREATE POLICY "Admin read analytics events"
  ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete analytics events" ON analytics_events;
CREATE POLICY "Admin delete analytics events"
  ON analytics_events FOR DELETE USING (auth.role() = 'authenticated');
