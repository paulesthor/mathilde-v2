CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin delete subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.role() = 'authenticated');
