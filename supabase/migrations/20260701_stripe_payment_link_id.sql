ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stripe_payment_link_id text;
