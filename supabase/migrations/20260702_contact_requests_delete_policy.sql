-- La suppression d'une demande de contact depuis l'admin (AdminContacts.jsx)
-- n'avait pas de policy RLS correspondante : DELETE était silencieusement
-- bloqué pour tout le monde, y compris les utilisateurs authentifiés.
DROP POLICY IF EXISTS "Admin delete contact requests" ON contact_requests;
CREATE POLICY "Admin delete contact requests"
  ON contact_requests FOR DELETE
  USING (auth.role() = 'authenticated');
