import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { uploadImageToBucket, removeImageFromBucket } from '../../lib/imageUpload';
import InlineEditableImage from './InlineEditableImage';

const BUCKET = 'site-content';

// Image singleton auto-chargeante : une seule ligne par (page, section)
// dans site_content. Crée la ligne au premier enregistrement (upsert).
export default function EditableImage({ page, section, fallback, alt = '', className = '', imgClassName = '' }) {
    const { showToast } = useToast();
    const [row, setRow] = useState(null);
    const [src, setSrc] = useState(fallback);

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
            });
        return () => { cancelled = true; };
    }, [page, section]);

    const handleUpload = async (file) => {
        try {
            const newUrl = await uploadImageToBucket(supabase, BUCKET, file);
            const oldUrl = row?.image_url;
            if (row) {
                const { error } = await supabase.from('site_content').update({ image_url: newUrl }).eq('id', row.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('site_content')
                    .insert([{ page, section, kind: 'image', image_url: newUrl }])
                    .select('id')
                    .single();
                if (error) throw error;
                setRow({ id: data.id, image_url: newUrl });
            }
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
