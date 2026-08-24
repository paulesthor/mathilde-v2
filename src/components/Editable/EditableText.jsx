import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useToast } from '../../contexts/ToastContext';
import { getCachedSingle, setCachedSingle } from '../../lib/siteContent';
import InlineEditable from './InlineEditable';

// Champ texte singleton auto-chargeant : une seule ligne par (page, section)
// dans site_content. Crée la ligne au premier enregistrement (upsert).
// Rendu identique au texte statique tant que le mode édition n'est pas actif.
export default function EditableText({ page, section, fallback = '', as = 'span', className = '', multiline = true }) {
    const { showToast } = useToast();
    // Démarre avec le dernier contenu connu (cache local) plutôt que le texte
    // par défaut, pour éviter le flash "ancien texte -> vrai texte" au
    // chargement / rafraîchissement de la page.
    const cached = getCachedSingle(page, section);
    const [row, setRow] = useState(cached || null);
    const [value, setValue] = useState(cached?.text_value?.trim() ? cached.text_value : fallback);

    useEffect(() => {
        let cancelled = false;
        supabase
            .from('site_content')
            .select('id, text_value')
            .eq('page', page)
            .eq('section', section)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return;
                setRow(data || null);
                setValue(data?.text_value?.trim() ? data.text_value : fallback);
                setCachedSingle(page, section, data || null);
            });
        return () => { cancelled = true; };
    }, [page, section]);

    const handleCommit = async (newValue) => {
        try {
            let newRow;
            if (row) {
                const { error } = await supabase.from('site_content').update({ text_value: newValue }).eq('id', row.id);
                if (error) throw error;
                newRow = { id: row.id, text_value: newValue };
            } else {
                const { data, error } = await supabase
                    .from('site_content')
                    .insert([{ page, section, kind: 'text', text_value: newValue }])
                    .select('id')
                    .single();
                if (error) throw error;
                newRow = { id: data.id, text_value: newValue };
            }
            setRow(newRow);
            setCachedSingle(page, section, newRow);
            setValue(newValue);
            showToast('Enregistré', 'success');
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        }
    };

    return (
        <InlineEditable value={value} onCommit={handleCommit} as={as} className={className} multiline={multiline} />
    );
}
