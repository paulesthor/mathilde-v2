import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { uploadImageToBucket, removeImageFromBucket } from '../../lib/imageUpload';
import { getCachedSingle, setCachedSingle } from '../../lib/siteContent';
import InlineEditableImage from './InlineEditableImage';

const BUCKET = 'site-content';

// Image singleton auto-chargeante : une seule ligne par (page, section)
// dans site_content. Crée la ligne au premier enregistrement (upsert).
export default function EditableImage({ page, section, fallback, alt = '', className = '', imgClassName = '' }) {
    const { showToast } = useToast();
    // Démarre avec le dernier contenu connu (cache local) plutôt que la photo
    // par défaut, pour éviter le flash "ancienne photo -> vraie photo" au
    // chargement / rafraîchissement de la page.
    const cached = getCachedSingle(page, section);
    const [row, setRow] = useState(cached || null);
    const [src, setSrc] = useState(cached?.image_url || fallback);

    useEffect(() => {
        let cancelled = false;
        supabase
            .from('site_content')
            .select('id, image_url')
            .eq('page', page)
            .eq('section', section)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return;
                setRow(data || null);
                setSrc(data?.image_url || fallback);
                setCachedSingle(page, section, data || null);
            });
        return () => { cancelled = true; };
    }, [page, section]);

    const handleUpload = async (file) => {
        try {
            const newUrl = await uploadImageToBucket(supabase, BUCKET, file);
            const oldUrl = row?.image_url;
            let newRow;
            if (row) {
                const { error } = await supabase.from('site_content').update({ image_url: newUrl }).eq('id', row.id);
                if (error) throw error;
                newRow = { id: row.id, image_url: newUrl };
            } else {
                const { data, error } = await supabase
                    .from('site_content')
                    .insert([{ page, section, kind: 'image', image_url: newUrl }])
                    .select('id')
                    .single();
                if (error) throw error;
                newRow = { id: data.id, image_url: newUrl };
            }
            setRow(newRow);
            setCachedSingle(page, section, newRow);
            if (oldUrl) await removeImageFromBucket(supabase, BUCKET, oldUrl);
            setSrc(newUrl);
            showToast('Photo mise à jour', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <InlineEditableImage src={src} alt={alt} onUpload={handleUpload} className={className} imgClassName={imgClassName} />
    );
}
