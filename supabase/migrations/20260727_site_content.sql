-- Contenu éditorial du site (textes + photos) piloté par l'admin.
-- Permet à la cliente de modifier elle-même le contenu des pages publiques
-- (hors "Dispo" qui a déjà sa propre gestion via la table products).

CREATE TABLE IF NOT EXISTS site_content (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page         text        NOT NULL
                           CHECK (page IN ('home', 'about', 'realisations', 'creations', 'prestations', 'contact')),
  section      text        NOT NULL,
  kind         text        NOT NULL DEFAULT 'text'
                           CHECK (kind IN ('text', 'image', 'list_item')),
  title        text,
  text_value   text,
  image_url    text,
  extra        jsonb,
  sort_order   int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Une seule ligne par (page, section) pour les blocs "singleton" (texte/image).
-- Les list_item (section = 'item') peuvent avoir plusieurs lignes.
CREATE UNIQUE INDEX IF NOT EXISTS site_content_singleton_key
  ON site_content (page, section)
  WHERE kind <> 'list_item';

CREATE OR REPLACE FUNCTION set_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_content_set_updated_at ON site_content;
CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION set_site_content_updated_at();

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site content" ON site_content;
CREATE POLICY "Public read site content"
  ON site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert site content" ON site_content;
CREATE POLICY "Admin insert site content"
  ON site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update site content" ON site_content;
CREATE POLICY "Admin update site content"
  ON site_content FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete site content" ON site_content;
CREATE POLICY "Admin delete site content"
  ON site_content FOR DELETE USING (auth.role() = 'authenticated');

-- Bucket de stockage dédié au contenu éditorial (photos hero, réalisations, créations...)
-- distinct du bucket "products" réservé au catalogue boutique.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site-content bucket" ON storage.objects;
CREATE POLICY "Public read site-content bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-content');

DROP POLICY IF EXISTS "Admin insert site-content bucket" ON storage.objects;
CREATE POLICY "Admin insert site-content bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-content' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update site-content bucket" ON storage.objects;
CREATE POLICY "Admin update site-content bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-content' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete site-content bucket" ON storage.objects;
CREATE POLICY "Admin delete site-content bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-content' AND auth.role() = 'authenticated');

-- ============================================================
-- Seed des listes existantes (réalisations, créations, prestations,
-- carrousel d'accueil) pour que la cliente retrouve immédiatement
-- ses contenus actuels dans l'admin, prêts à être modifiés/supprimés.
-- image_url reste NULL quand la photo d'origine est un asset local du
-- build (le site retombe alors sur cet asset tant qu'aucune photo n'a
-- été téléversée) ; les URLs Unsplash existantes sont reprises telles quelles.
-- Ne s'exécute qu'une seule fois (idempotent) grâce à la garde ci-dessous.
-- ============================================================

DO $seed$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_content) THEN

    INSERT INTO site_content (page, section, kind, title, text_value, image_url, extra, sort_order) VALUES
      ('home', 'hero_carousel', 'list_item', $$Pièces sans fin — Colonne de tabourets empilables$$, NULL, NULL, NULL, 0),
      ('home', 'hero_carousel', 'list_item', $$Bridge Allison — Tissu Memphis d'inspiration rétro$$, NULL, NULL, NULL, 1),
      ('home', 'hero_carousel', 'list_item', $$Bridges Pauline — Léopard revisité et coloré$$, NULL, NULL, NULL, 2),
      ('home', 'hero_carousel', 'list_item', $$Mathilde, fondatrice de l'Atelier Gesta$$, NULL, NULL, NULL, 3);

    INSERT INTO site_content (page, section, kind, title, text_value, image_url, extra, sort_order) VALUES
      ('realisations', 'item', 'list_item',
       $$Pièces sans fin$$,
       $$J'aime recevoir mes amis et ma famille. Très vite, le cercle des convives s'agrandit et les places viennent à manquer autour de la table basse. L'idée de la colonne de tabourets empilables est née : à l'arrivée des invités, il suffit de les descendre pour que chacun trouve sa place. Ces tabourets sont habillés de tissus aux couleurs vives. Les motifs qui les ornent sont obtenus par un jeu d'empiècements textiles. Une fois les invités repartis, les tabourets reprennent leur forme sculpturale. Empilés en colonne, ils évoquent la Colonne sans fin de Constantin Brancusi. Pour ce projet sur le thème de l'Art Déco, j'ai choisi de m'éloigner des modèles existants pour concevoir un meuble original, modulable et pensé pour s'adapter aux petits espaces.$$,
       NULL,
       '{"details": ["Structure bois par Victor Chastant", "Tissu Highlander (Clarke & Clarke)", "Découpe laser au Miiido de Bliiida"]}'::jsonb,
       0),
      ('realisations', 'item', 'list_item',
       $$Bridge Allison$$,
       $$J'adore les audacieux qui mettent leurs mains devant les yeux, ceux qui doutent, mais qui se jettent quand même à l'eau. Ceux qui ont peur de se tromper, mais qui se disent YOLO. On a des points communs, c'est sûrement pour ça qu'ils me font confiance. Un jour, la propriétaire de ce bridge a osé. Vraiment osé : une belle serviette de bain, une agrafeuse de bureau… et hop, fauteuil retapissé. Le résultat n'était pas si mal, mais ce beau bridge méritait mieux. Adieu la serviette de plage : aujourd'hui, il se pare de ce superbe tissu au style Memphis, pile à la hauteur de son audace ✨$$,
       NULL,
       '{"details": ["Style Memphis rétro et graphique", "Tissu Odyssée de chez Camengo", "Structure bois restaurée"]}'::jsonb,
       1),
      ('realisations', 'item', 'list_item',
       $$Bridges Pauline$$,
       $$Le léopard, on en voit partout… Réveillez le tigre qui est en vous ! Restauration de fauteuils vintage avec réfection complète et tissu ultra coloré. Le bois a été conservé, l'assise a été refaite, et surtout ce tissu complètement fou de chez Clarke&Clarke transforme ces fauteuils en véritables pièces de décoration fortes.$$,
       NULL,
       '{"details": ["Assises refaites à neuf", "Tissu graphique Clarke & Clarke", "Structure en bois conservée et sublimée"]}'::jsonb,
       2);

    INSERT INTO site_content (page, section, kind, title, text_value, image_url, extra, sort_order) VALUES
      ('creations', 'item', 'list_item',
       $$Coussin Plissé$$,
       $$Coussin décoratif réalisé avec un plissé main technique. Une exploration des volumes textiles.$$,
       'https://images.unsplash.com/photo-1574044199960-4fed290d2fd2?auto=format&fit=crop&q=80&w=1000',
       '{"details": ["Velours de coton", "Plissé fait main"]}'::jsonb,
       0),
      ('creations', 'item', 'list_item',
       $$Tête de Lit 'Aube'$$,
       $$Création sur-mesure d'une tête de lit capitonnée, pensée pour s'intégrer parfaitement dans une chambre aux tons minéraux.$$,
       'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=1000',
       '{"details": ["Lin lavé froissé", "Capitonnage diamant"]}'::jsonb,
       1),
      ('creations', 'item', 'list_item',
       $$Banette de Fenêtre$$,
       $$Aménagement d'une alcôve avec des coussins sur-mesure pour créer un coin lecture lumineux et graphique.$$,
       'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1000',
       '{"details": ["Laine bouillie", "Sur-mesure total"]}'::jsonb,
       2);

    INSERT INTO site_content (page, section, kind, title, text_value, image_url, extra, sort_order) VALUES
      ('prestations', 'item', 'list_item',
       $$Rénovation de sièges$$,
       $$Redonnez vie à vos assises anciennes ou abîmées. De la réfection complète en crin végétal à la couverture simple, chaque projet est étudié pour respecter l'histoire du meuble tout en l'adaptant à votre intérieur actuel.$$,
       NULL,
       '{"details": ["Diagnostic et devis personnalisé", "Dégarnissage et mise à nu de la carcasse", "Restauration des fûts", "Garniture traditionnelle ou contemporaine"]}'::jsonb,
       0),
      ('prestations', 'item', 'list_item',
       $$Rideaux & Voilages$$,
       $$Habillez vos fenêtres sur-mesure pour créer une atmosphère unique, filtrer la lumière ou isoler vos pièces. Confection artisanale selon les règles de l'art.$$,
       NULL,
       '{"details": ["Prise de mesures à domicile", "Conseil dans le choix des textiles", "Confection sur-mesure", "Différentes finitions de têtes"]}'::jsonb,
       1),
      ('prestations', 'item', 'list_item',
       $$Créations & Sur Mesure$$,
       $$Des créations textiles personnalisées pour parfaire votre décoration et apporter du confort à chaque recoin de votre intérieur.$$,
       NULL,
       '{"details": ["Coussins décoratifs", "Têtes de lit tapissées", "Projets personnalisés"]}'::jsonb,
       2);

  END IF;
END $seed$;
