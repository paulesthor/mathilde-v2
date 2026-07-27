import { useState, useEffect } from 'react';
import { Plus, Trash, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { prepareImageFile, uploadImageToBucket, removeImageFromBucket } from '../../lib/imageUpload';

const BUCKET = 'site-content';

// Éditeur générique de liste (ajout/suppression/réorganisation) pour les
// sections de type list_item de site_content : carrousel accueil,
// réalisations, créations, prestations.
export default function ContentListEditor({ page, section, titleLabel = 'Titre', hasImage = false, hasDescription = true, hasDetails = false }) {
    const { showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [uploadingId, setUploadingId] = useState(null);

    const fetchRows = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('site_content')
            .select('id, title, text_value, image_url, extra, sort_order')
            .eq('page', page)
            .eq('section', section)
            .eq('kind', 'list_item')
            .order('sort_order', { ascending: true });
        if (!error) setRows(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchRows(); }, [page, section]);

    const addItem = async () => {
        const nextOrder = rows.length > 0 ? Math.max(...rows.map(r => r.sort_order)) + 1 : 0;
        const { error } = await supabase.from('site_content').insert([{
            page, section, kind: 'list_item', title: 'Nouvel élément', text_value: '', extra: hasDetails ? { details: [] } : null, sort_order: nextOrder,
        }]);
        if (error) { showToast("Erreur lors de l'ajout : " + error.message, 'error'); return; }
        fetchRows();
    };

    const deleteItem = async (row) => {
        if (!confirm("Supprimer cet élément ?")) return;
        if (row.image_url) await removeImageFromBucket(supabase, BUCKET, row.image_url);
        const { error } = await supabase.from('site_content').delete().eq('id', row.id);
        if (error) { showToast("Erreur lors de la suppression : " + error.message, 'error'); return; }
        fetchRows();
    };

    const moveItem = async (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= rows.length) return;
        const a = rows[index];
        const b = rows[targetIndex];
        setSavingId(a.id);
        await Promise.all([
            supabase.from('site_content').update({ sort_order: b.sort_order }).eq('id', a.id),
            supabase.from('site_content').update({ sort_order: a.sort_order }).eq('id', b.id),
        ]);
        setSavingId(null);
        fetchRows();
    };

    const saveField = async (row, patch) => {
        setSavingId(row.id);
        const { error } = await supabase.from('site_content').update(patch).eq('id', row.id);
        setSavingId(null);
        if (error) { showToast('Erreur lors de la sauvegarde : ' + error.message, 'error'); return; }
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    };

    const handleImageChange = async (row, file) => {
        if (!file) return;
        setUploadingId(row.id);
        try {
            const { file: prepared } = await prepareImageFile(file);
            const newUrl = await uploadImageToBucket(supabase, BUCKET, prepared);
            if (row.image_url) await removeImageFromBucket(supabase, BUCKET, row.image_url);
            await saveField(row, { image_url: newUrl });
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploadingId(null);
        }
    };

    const updateDetails = (row, text) => {
        const details = text.split('\n').map((s) => s.trim()).filter(Boolean);
        saveField(row, { extra: { ...(row.extra || {}), details } });
    };

    if (loading) return <p className="font-mono text-sm text-muted-foreground py-6">Chargement...</p>;

    return (
        <div className="space-y-6">
            {rows.map((row, index) => (
                <div key={row.id} className="border border-border/80 bg-muted/5 rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-2">
                            <button onClick={() => moveItem(index, -1)} disabled={index === 0 || savingId === row.id} className="p-1.5 border border-border rounded hover:border-foreground disabled:opacity-30 transition-colors" title="Monter">
                                <ChevronUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => moveItem(index, 1)} disabled={index === rows.length - 1 || savingId === row.id} className="p-1.5 border border-border rounded hover:border-foreground disabled:opacity-30 transition-colors" title="Descendre">
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>
                        <button onClick={() => deleteItem(row)} className="p-1.5 border border-border text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded transition-colors" title="Supprimer">
                            <Trash className="h-4 w-4" />
                        </button>
                    </div>

                    {hasImage && (
                        <div className="flex items-center gap-4">
                            {row.image_url && (
                                <img src={row.image_url} alt="" className="w-20 h-20 object-cover rounded border border-border" />
                            )}
                            <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] uppercase tracking-widest border border-border px-3 py-2 rounded hover:border-primary transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                                {uploadingId === row.id ? 'Envoi...' : (row.image_url ? 'Remplacer la photo' : 'Ajouter une photo')}
                                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageChange(row, e.target.files[0])} />
                            </label>
                        </div>
                    )}

                    <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{titleLabel}</label>
                        <input
                            type="text"
                            defaultValue={row.title || ''}
                            onBlur={(e) => e.target.value !== row.title && saveField(row, { title: e.target.value })}
                            className="w-full bg-background border border-border px-3 py-2 font-sans text-sm focus:border-primary outline-none transition-colors"
                        />
                    </div>

                    {hasDescription && (
                        <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Description</label>
                            <textarea
                                defaultValue={row.text_value || ''}
                                rows={3}
                                onBlur={(e) => e.target.value !== row.text_value && saveField(row, { text_value: e.target.value })}
                                className="w-full bg-background border border-border px-3 py-2 font-sans text-sm focus:border-primary outline-none resize-none transition-colors"
                            />
                        </div>
                    )}

                    {hasDetails && (
                        <div>
                            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Points clés (un par ligne)</label>
                            <textarea
                                defaultValue={(row.extra?.details || []).join('\n')}
                                rows={3}
                                onBlur={(e) => updateDetails(row, e.target.value)}
                                className="w-full bg-background border border-border px-3 py-2 font-sans text-sm focus:border-primary outline-none resize-none transition-colors"
                            />
                        </div>
                    )}
                </div>
            ))}

            <button
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-border py-4 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors rounded-lg"
            >
                <Plus className="h-4 w-4" /> Ajouter un élément
            </button>
        </div>
    );
}
