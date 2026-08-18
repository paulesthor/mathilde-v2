import { supabase } from '../utils/supabaseClient';

// Charge les list_item d'une page, groupés par section et triés.
// En cas d'erreur ou de table vide, retourne une collection vide : la page
// publique retombe alors sur son contenu par défaut en dur.
export async function fetchSiteContent(page) {
    try {
        const { data, error } = await supabase
            .from('site_content')
            .select('id, page, section, kind, title, text_value, image_url, extra, sort_order')
            .eq('page', page)
            .eq('kind', 'list_item')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        const itemsBySection = {};
        for (const row of data || []) {
            if (!itemsBySection[row.section]) itemsBySection[row.section] = [];
            itemsBySection[row.section].push(row);
        }

        return { itemsBySection };
    } catch {
        return { itemsBySection: {} };
    }
}

export function getItems(itemsBySection, section, fallbackArray) {
    const items = itemsBySection[section];
    return items && items.length > 0 ? items : fallbackArray;
}
