import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { prepareImageFile, uploadImageToBucket, removeImageFromBucket } from '../../lib/imageUpload';

const BUCKET = 'site-content';

// Champ singleton (texte, texte long ou image) de site_content : une seule
// ligne par (page, section). Crée la ligne au premier enregistrement (upsert).
export default function ContentSingletonField({ page, section, label, type = 'text', fallback = '', help }) {
    const { showToast } = useToast();
    const [row, setRow] = useState(null);
    const [value, setValue] = useState(fallback);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('site_content')
                .select('id, text_value, image_url')
                .eq('page', page)
                .eq('section', section)
                .maybeSingle();
            setRow(data || null);
            if (type === 'image') {
                setValue(data?.image_url || fallback);
            } else {
                setValue(data?.text_value ?? fallback);
            }
            setLoading(false);
        };
        load();
    }, [page, section]);

    const persist = async (patch) => {
        if (row) {
            const { error } = await supabase.from('site_content').update(patch).eq('id', row.id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('site_content').insert([{
                page, section, kind: type === 'image' ? 'image' : 'text', ...patch,
            }]).select('id').single();
            if (error) throw error;
            setRow({ id: data.id });
        }
    };

    const handleTextBlur = async (e) => {
        const newValue = e.target.value;
        if (newValue === (row?.text_value ?? fallback)) return;
        try {
            await persist({ text_value: newValue });
            showToast('Enregistré', 'success');
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        }
    };

    const handleImageChange = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const { file: prepared } = await prepareImageFile(file);
            const newUrl = await uploadImageToBucket(supabase, BUCKET, prepared);
            const oldUrl = row?.image_url;
            await persist({ image_url: newUrl });
            if (oldUrl) await removeImageFromBucket(supabase, BUCKET, oldUrl);
            setValue(newUrl);
            showToast('Photo mise à jour', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return null;

    if (type === 'image') {
        return (
            <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</label>
                <div className="flex items-center gap-4">
                    {value && <img src={value} alt="" className="w-24 h-24 object-cover rounded border border-border" />}
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] uppercase tracking-widest border border-border px-3 py-2 rounded hover:border-primary transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        {uploading ? 'Envoi...' : 'Remplacer la photo'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageChange(e.target.files[0])} />
                    </label>
                </div>
                {help && <p className="font-mono text-[9px] text-muted-foreground mt-2">{help}</p>}
            </div>
        );
    }

    return (
        <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    defaultValue={value}
                    rows={6}
                    onBlur={handleTextBlur}
                    className="w-full bg-background border border-border px-3 py-2 font-sans text-sm focus:border-primary outline-none resize-none transition-colors"
                />
            ) : (
                <input
                    type="text"
                    defaultValue={value}
                    onBlur={handleTextBlur}
                    className="w-full bg-background border border-border px-3 py-2 font-sans text-sm focus:border-primary outline-none transition-colors"
                />
            )}
            {help && <p className="font-mono text-[9px] text-muted-foreground mt-2">{help}</p>}
        </div>
    );
}
