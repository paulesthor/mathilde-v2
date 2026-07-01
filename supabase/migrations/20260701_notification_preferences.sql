ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS notify_orders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_contacts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_reviews boolean NOT NULL DEFAULT true;

CREATE POLICY "Admin update subscriptions"
  ON push_subscriptions FOR UPDATE USING (auth.role() = 'authenticated');
