import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { fetchSiteContent, getItems, getCachedSiteContent } from '../lib/siteContent';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import EditableText from '../components/Editable/EditableText';
import InlineEditable from '../components/Editable/InlineEditable';
import { AddItemTile, DeleteItemButton } from '../components/Editable/EditableListControls';

const DEFAULT_PRESTATIONS = [
    {
        id: '01',
        number: '01',
        title: "Rénovation de sièges",
        description: "Redonnez vie à vos assises anciennes ou abîmées. De la réfection complète en crin végétal à la couverture simple, chaque projet est étudié pour respecter l'histoire du meuble tout en l'adaptant à votre intérieur actuel.",
        details: [
            "Diagnostic et devis personnalisé",
            "Dégarnissage et mise à nu de la carcasse",
            "Restauration des fûts",
            "Garniture traditionnelle ou contemporaine",
        ]
    },
    {
        id: '02',
        number: '02',
        title: "Rideaux & Voilages",
        description: "Habillez vos fenêtres sur-mesure pour créer une atmosphère unique, filtrer la lumière ou isoler vos pièces. Confection artisanale selon les règles de l'art.",
        details: [
            "Prise de mesures à domicile",
            "Conseil dans le choix des textiles",
            "Confection sur-mesure",
            "Différentes finitions de têtes",
        ]
    },
    {
        id: '03',
        number: '03',
        title: "Créations & Sur Mesure",
        description: "Des créations textiles personnalisées pour parfaire votre décoration et apporter du confort à chaque recoin de votre intérieur.",
        details: [
            "Coussins décoratifs",
            "Têtes de lit tapissées",
            "Projets personnalisés",
        ]
    }
];

function mapPrestationRow(row, idx) {
    return {
        id: row.id,
        number: String(idx + 1).padStart(2, '0'),
        title: row.title,
        description: row.text_value,
        details: row.extra?.details || [],
        sortOrder: row.sort_order,
    };
}

export default function Prestations() {
    const { showToast } = useToast();
    const [hoveredId, setHoveredId] = useState(null);
    // Démarre avec le dernier contenu connu (cache local) plutôt que le
    // contenu par défaut, pour éviter le flash au chargement de la page.
    const [prestationsData, setPrestationsData] = useState(() => {
        const rows = getItems(getCachedSiteContent('prestations'), 'item', null);
        return rows ? rows.map(mapPrestationRow) : DEFAULT_PRESTATIONS;
    });

    useEffect(() => {
        const loadContent = async () => {
            const { itemsBySection } = await fetchSiteContent('prestations');
            const rows = getItems(itemsBySection, 'item', null);
            if (!rows) return;
            setPrestationsData(rows.map(mapPrestationRow));
        };
        loadContent();
    }, []);

    const updateItem = async (id, patch) => {
        try {
            const { error } = await supabase.from('site_content').update(patch).eq('id', id);
            if (error) throw error;
            setPrestationsData((prev) => prev.map((item) => (item.id === id ? {
                ...item,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.text_value !== undefined ? { description: patch.text_value } : {}),
                ...(patch.extra !== undefined ? { details: patch.extra.details || [] } : {}),
            } : item)));
            showToast('Enregistré', 'success');
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        }
    };

    const handleDetailsCommit = (item, text) => {
        const details = text.split('\n').map((s) => s.trim()).filter(Boolean);
        updateItem(item.id, { extra: { details } });
    };

    const addItem = async () => {
        const nextOrder = prestationsData.length > 0 ? Math.max(...prestationsData.map((i) => i.sortOrder || 0)) + 1 : 0;
        const { data, error } = await supabase.from('site_content').insert([{
            page: 'prestations', section: 'item', kind: 'list_item', title: 'Nouvelle prestation', text_value: '', extra: { details: [] }, sort_order: nextOrder,
        }]).select('id').single();
        if (error) { showToast("Erreur lors de l'ajout : " + error.message, 'error'); return; }
        setPrestationsData((prev) => [...prev, {
            id: data.id, number: String(prev.length + 1).padStart(2, '0'), title: 'Nouvelle prestation', description: '', details: [], sortOrder: nextOrder,
        }]);
    };

    const deleteItem = async (item) => {
        const { error } = await supabase.from('site_content').delete().eq('id', item.id);
        if (error) { showToast('Erreur lors de la suppression : ' + error.message, 'error'); return; }
        setPrestationsData((prev) => prev.filter((i) => i.id !== item.id));
    };

    return (
        <div className="animate-in fade-in duration-1000 min-h-full bg-background pt-32 pb-24 text-foreground flex flex-col justify-center">
            <Helmet>
                <title>Rénovation de Sièges & Rideaux Sur-Mesure | Atelier Gesta</title>
                <meta name="description" content="Découvrez les prestations de l'Atelier Gesta : rénovation de sièges, rideaux sur-mesure, conseil en tissu. Artisanat parisien de qualité." />
            </Helmet>
            <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-12">

                {/* Massive section title */}
                <div className="mb-24 md:mb-32 flex justify-end">
                    <h1 className="font-editorial text-5xl md:text-8xl w-full md:w-2/3 leading-none tracking-tighter mix-blend-difference text-right">
                        <EditableText page="prestations" section="page_title" fallback="Expertise & Savoir-faire." as="span" />
                    </h1>
                </div>

                {/* Hover-driven interactive lists */}
                <div className="border-t border-border">
                    {prestationsData.map((item) => (
                        <div
                            key={item.id}
                            className="group relative border-b border-border py-12 md:py-16 flex flex-col md:flex-row items-baseline justify-between transition-colors duration-500 hover:bg-muted/50"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <DeleteItemButton onDelete={() => deleteItem(item)} label="Supprimer cette prestation" />
                            {/* Left Side: Number + Title */}
                            <div className="flex items-baseline space-x-8 md:w-1/2">
                                <span className="font-mono text-xl md:text-2xl text-muted-foreground transition-colors group-hover:text-primary">
                                    {item.number}
                                </span>
                                <InlineEditable
                                    value={item.title}
                                    onCommit={(v) => updateItem(item.id, { title: v })}
                                    as="h2"
                                    className="font-editorial text-5xl md:text-7xl tracking-tighter transition-transform duration-500 group-hover:translate-x-4"
                                    multiline={false}
                                />
                            </div>

                            {/* Right Side: Details (Fades in heavily on hover/focus) */}
                            <div className="mt-8 md:mt-0 md:w-1/2 md:pl-12 flex flex-col justify-center transition-all duration-500 ease-out md:opacity-40 group-hover:opacity-100">
                                <InlineEditable
                                    value={item.description}
                                    onCommit={(v) => updateItem(item.id, { text_value: v })}
                                    as="p"
                                    className="font-sans font-light text-lg md:text-xl leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors max-w-lg"
                                />

                                {/* Expandable details list that shows on hover strongly on Desktop */}
                                <div className={`mt-8 overflow-hidden transition-all duration-700 ${hoveredId === item.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-0'}`}>
                                    <InlineEditable
                                        value={item.details.join('\n')}
                                        onCommit={(v) => handleDetailsCommit(item, v)}
                                        as="div"
                                        className="font-mono text-sm tracking-widest uppercase whitespace-pre-line"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <AddItemTile onAdd={addItem} label="Ajouter une prestation" className="mt-12" />
            </div>
        </div>
    );
}
