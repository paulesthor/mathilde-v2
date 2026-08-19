import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash } from 'lucide-react';
import piece1 from '../../assets/piece_1.webp';
import piece2 from '../../assets/piece_2.webp';
import piece3 from '../../assets/piece_3.webp';
import portraitMathilde from '../../assets/portrait_mathilde.webp';
import { fetchSiteContent, getItems } from '../../lib/siteContent';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { prepareImageFile, uploadImageToBucket, removeImageFromBucket } from '../../lib/imageUpload';
import InlineEditable from '../Editable/InlineEditable';

const BUCKET = 'site-content';
const FALLBACK_LOCAL_IMAGES = [piece1, piece2, piece3, portraitMathilde];

const DEFAULT_ROWS = [
  { id: 'default-0', title: "Pièces sans fin — Colonne de tabourets empilables", image_url: null, sort_order: 0 },
  { id: 'default-1', title: "Bridge Allison — Tissu Memphis d'inspiration rétro", image_url: null, sort_order: 1 },
  { id: 'default-2', title: "Bridges Pauline — Léopard revisité et coloré", image_url: null, sort_order: 2 },
  { id: 'default-3', title: "Mathilde, fondatrice de l'Atelier Gesta", image_url: null, sort_order: 3 },
];

const INTERVAL_MS = 3800;

export default function HeroCarousel() {
  const { showToast } = useToast();
  const { isAdmin, isEditMode } = useEditMode();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadRows = async () => {
    const { itemsBySection } = await fetchSiteContent('home');
    const items = getItems(itemsBySection, 'hero_carousel', null);
    if (items) setRows(items);
  };

  useEffect(() => { loadRows(); }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % rows.length);
        setAnimating(false);
      }, 500);
    }, INTERVAL_MS);
  }, [rows.length]);

  const goTo = (index) => {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 500);
    // Repart d'un intervalle complet après une navigation manuelle, sinon
    // l'auto-rotation pouvait retomber juste derrière et écraser le clic.
    if (!isEditMode) startTimer();
  };

  useEffect(() => {
    if (isEditMode) return; // pause l'auto-rotation pendant l'édition
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [isEditMode, startTimer]);

  const currentRow = rows[current] || rows[0];
  const currentSrc = currentRow?.image_url || FALLBACK_LOCAL_IMAGES[current] || FALLBACK_LOCAL_IMAGES[0];

  const saveCaption = async (newTitle) => {
    try {
      if (String(currentRow.id).startsWith('default-')) {
        const { data, error } = await supabase.from('site_content').insert([{
          page: 'home', section: 'hero_carousel', kind: 'list_item', title: newTitle, sort_order: currentRow.sort_order,
        }]).select('id').single();
        if (error) throw error;
        setRows((prev) => prev.map((r, i) => (i === current ? { ...r, id: data.id, title: newTitle } : r)));
      } else {
        const { error } = await supabase.from('site_content').update({ title: newTitle }).eq('id', currentRow.id);
        if (error) throw error;
        setRows((prev) => prev.map((r, i) => (i === current ? { ...r, title: newTitle } : r)));
      }
      showToast('Enregistré', 'success');
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleImageDoubleClick = (e) => {
    if (!isAdmin || !isEditMode) return;
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { file: prepared } = await prepareImageFile(file);
      const newUrl = await uploadImageToBucket(supabase, BUCKET, prepared);
      const oldUrl = currentRow.image_url;
      if (String(currentRow.id).startsWith('default-')) {
        const { data, error } = await supabase.from('site_content').insert([{
          page: 'home', section: 'hero_carousel', kind: 'list_item', title: currentRow.title, image_url: newUrl, sort_order: currentRow.sort_order,
        }]).select('id').single();
        if (error) throw error;
        setRows((prev) => prev.map((r, i) => (i === current ? { ...r, id: data.id, image_url: newUrl } : r)));
      } else {
        const { error } = await supabase.from('site_content').update({ image_url: newUrl }).eq('id', currentRow.id);
        if (error) throw error;
        setRows((prev) => prev.map((r, i) => (i === current ? { ...r, image_url: newUrl } : r)));
      }
      if (oldUrl) await removeImageFromBucket(supabase, BUCKET, oldUrl);
      showToast('Photo mise à jour', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const addSlide = async () => {
    const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from('site_content').insert([{
      page: 'home', section: 'hero_carousel', kind: 'list_item', title: 'Nouvelle photo', sort_order: nextOrder,
    }]).select('id, title, image_url, sort_order').single();
    if (error) { showToast("Erreur lors de l'ajout : " + error.message, 'error'); return; }
    setRows((prev) => [...prev, data]);
    setCurrent(rows.length);
  };

  const deleteSlide = async () => {
    if (rows.length <= 1) { showToast('Le carrousel doit garder au moins une photo.', 'error'); return; }
    if (!confirm('Supprimer cette photo du carrousel ?')) return;
    if (currentRow.image_url) await removeImageFromBucket(supabase, BUCKET, currentRow.image_url);
    if (!String(currentRow.id).startsWith('default-')) {
      const { error } = await supabase.from('site_content').delete().eq('id', currentRow.id);
      if (error) { showToast('Erreur lors de la suppression : ' + error.message, 'error'); return; }
    }
    const newRows = rows.filter((_, i) => i !== current);
    setRows(newRows);
    setCurrent((c) => Math.min(c, newRows.length - 1));
  };

  return (
    <div className="hero-carousel-wrapper">
      <div
        className={`hero-carousel-img-container relative ${animating ? 'carousel-fade-out' : 'carousel-fade-in'}`}
        onDoubleClick={handleImageDoubleClick}
      >
        <img src={currentSrc} alt={currentRow?.title || 'Atelier Gesta'} className="hero-carousel-img" />
        {isAdmin && isEditMode && (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer" />
            <button
              onClick={(e) => { e.preventDefault(); deleteSlide(); }}
              className="absolute top-3 right-3 p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg"
              aria-label="Supprimer cette photo"
            >
              <Trash className="h-4 w-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </>
        )}
      </div>

      {/* Dots */}
      <div className="hero-carousel-dots">
        {rows.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`hero-carousel-dot ${i === current ? 'active' : ''}`}
            aria-label={`Image ${i + 1}`}
          />
        ))}
        {isAdmin && isEditMode && (
          <button onClick={addSlide} className="hero-carousel-dot flex items-center justify-center" aria-label="Ajouter une photo">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Caption */}
      <InlineEditable
        value={currentRow?.title || ''}
        onCommit={saveCaption}
        as="p"
        className="hero-carousel-caption"
        multiline={false}
      />
    </div>
  );
}
