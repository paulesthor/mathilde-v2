import { supabase } from '../utils/supabaseClient';

// Charge tout le contenu éditorial d'une page et le classe en :
// - blocks : Map(section -> row) pour les champs singleton (texte/image)
// - itemsBySection : { section: [rows triés] } pour les listes (list_item)
// En cas d'erreur ou de table vide, retourne des collections vides : chaque
// page publique retombe alors sur son contenu par défaut en dur.
export async function fetchSiteContent(page) {
    try {
        const { data, error } = await supabase
            .from('site_content')
            .select('id, page, section, kind, title, text_value, image_url, extra, sort_order')
            .eq('page', page)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        const blocks = new Map();
        const itemsBySection = {};

        for (const row of data || []) {
            if (row.kind === 'list_item') {
                if (!itemsBySection[row.section]) itemsBySection[row.section] = [];
                itemsBySection[row.section].push(row);
            } else {
                blocks.set(row.section, row);
            }
        }

        return { blocks, itemsBySection };
    } catch {
        return { blocks: new Map(), itemsBySection: {} };
    }
}

export function getText(blocks, key, fallback) {
    const row = blocks.get(key);
    return row?.text_value?.trim() ? row.text_value : fallback;
}

export function getImage(blocks, key, fallback) {
    const row = blocks.get(key);
    return row?.image_url || fallback;
}

export function getItems(itemsBySection, section, fallbackArray) {
    const items = itemsBySection[section];
    return items && items.length > 0 ? items : fallbackArray;
}
