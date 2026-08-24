import { supabase } from '../utils/supabaseClient';

// Cache local (stale-while-revalidate) : évite qu'au chargement de la page,
// le temps que la requête Supabase réponde, on affiche brièvement les
// photos/textes par défaut avant qu'ils ne soient remplacés par le vrai
// contenu enregistré — on rend directement le dernier contenu connu, puis
// on rafraîchit en tâche de fond.
const CACHE_PREFIX = 'gesta_content_cache_';

function readCache(key) {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeCache(key, value) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
    } catch {
        // Stockage indisponible (navigation privée, quota plein) : tant pis, pas de cache.
    }
}

// Instantané du contenu réel injecté dans index.html au moment du build
// (voir vite.config.js) : contrairement au cache localStorage ci-dessus, il
// est déjà présent pour un tout nouveau visiteur qui n'a jamais mis les
// pieds sur le site, donc lui aussi voit directement les vraies photos/
// textes plutôt que les valeurs par défaut le temps du premier chargement.
let parsedSnapshot = null;

function readBuildSnapshot() {
    if (parsedSnapshot) return parsedSnapshot;
    try {
        const el = document.getElementById('__SITE_CONTENT__');
        parsedSnapshot = el ? JSON.parse(el.textContent) : [];
    } catch {
        parsedSnapshot = [];
    }
    return parsedSnapshot;
}

let snapshotItemsByPage = null;

function getSnapshotItemsByPage() {
    if (snapshotItemsByPage) return snapshotItemsByPage;
    snapshotItemsByPage = {};
    for (const row of readBuildSnapshot()) {
        if (row.kind !== 'list_item') continue;
        if (!snapshotItemsByPage[row.page]) snapshotItemsByPage[row.page] = {};
        if (!snapshotItemsByPage[row.page][row.section]) snapshotItemsByPage[row.page][row.section] = [];
        snapshotItemsByPage[row.page][row.section].push(row);
    }
    for (const page of Object.values(snapshotItemsByPage)) {
        for (const section of Object.values(page)) {
            section.sort((a, b) => a.sort_order - b.sort_order);
        }
    }
    return snapshotItemsByPage;
}

let snapshotSinglesByKey = null;

function getSnapshotSingles() {
    if (snapshotSinglesByKey) return snapshotSinglesByKey;
    snapshotSinglesByKey = {};
    for (const row of readBuildSnapshot()) {
        if (row.kind === 'list_item') continue;
        snapshotSinglesByKey[`${row.page}_${row.section}`] = row;
    }
    return snapshotSinglesByKey;
}

// Charge les list_item d'une page, groupés par section et triés.
// En cas d'erreur ou de table vide, retourne le dernier contenu mis en
// cache s'il existe, sinon une collection vide (la page publique retombe
// alors sur son contenu par défaut en dur).
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

        writeCache(`items_${page}`, itemsBySection);
        return { itemsBySection };
    } catch {
        return { itemsBySection: readCache(`items_${page}`) || {} };
    }
}

// Dernier contenu connu, à utiliser comme état initial pour éviter le
// flash "ancien contenu -> vrai contenu" au premier rendu : priorité au
// cache localStorage (le plus frais, mis à jour à chaque visite), puis à
// l'instantané figé dans le build (couvre aussi les nouveaux visiteurs).
export function getCachedSiteContent(page) {
    return readCache(`items_${page}`) || getSnapshotItemsByPage()[page] || {};
}

export function getCachedSingle(page, section) {
    return readCache(`single_${page}_${section}`) || getSnapshotSingles()[`${page}_${section}`] || null;
}

export function setCachedSingle(page, section, value) {
    writeCache(`single_${page}_${section}`, value);
}

export function getItems(itemsBySection, section, fallbackArray) {
    const items = itemsBySection[section];
    return items && items.length > 0 ? items : fallbackArray;
}
