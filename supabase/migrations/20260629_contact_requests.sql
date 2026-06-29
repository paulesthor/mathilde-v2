-- Table pour stocker les demandes de contact / devis
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

-- RLS : public peut insérer, seul l'admin (authentifié) peut lire/modifier
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert contact requests"
  ON contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin read contact requests"
  ON contact_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin update contact request status"
  ON contact_requests FOR UPDATE
  USING (auth.role() = 'authenticated');
