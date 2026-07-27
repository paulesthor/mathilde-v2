import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import MinimalModal from '../components/UI/MinimalModal';
import piece1 from '../assets/piece_1.webp';
import piece2 from '../assets/piece_2.webp';
import piece3 from '../assets/piece_3.webp';
import { fetchSiteContent, getItems } from '../lib/siteContent';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { useEditMode } from '../contexts/EditModeContext';
import { uploadImageToBucket, removeImageFromBucket } from '../lib/imageUpload';
import EditableText from '../components/Editable/EditableText';
import InlineEditable from '../components/Editable/InlineEditable';
import InlineEditableImage from '../components/Editable/InlineEditableImage';
import { AddItemTile, DeleteItemButton } from '../components/Editable/EditableListControls';

const BUCKET = 'site-content';
const FALLBACK_LOCAL_IMAGES = [piece1, piece2, piece3];

const DEFAULT_REALISATIONS = [
    {
        id: 1,
        title: "Pièces sans fin",
        image: piece1,
        description: "J’aime recevoir mes amis et ma famille. Très vite, le cercle des convives s’agrandit et les places viennent à manquer autour de la table basse. L’idée de la colonne de tabourets empilables est née : à l’arrivée des invités, il suffit de les descendre pour que chacun trouve sa place. Ces tabourets sont habillés de tissus aux couleurs vives. Les motifs qui les ornent sont obtenus par un jeu d’empiècements textiles. Une fois les invités repartis, les tabourets reprennent leur forme sculpturale. Empilés en colonne, ils évoquent la Colonne sans fin de Constantin Brancusi. Pour ce projet sur le thème de l’Art Déco, j’ai choisi de m’éloigner des modèles existants pour concevoir un meuble original, modulable et pensé pour s’adapter aux petits espaces.",
        details: [
            "Structure bois par Victor Chastant",
            "Tissu Highlander (Clarke & Clarke)",
            "Découpe laser au Miiido de Bliiida"
        ]
    },
    {
        id: 2,
        title: "Bridge Allison",
        image: piece2,
        description: "J’adore les audacieux qui mettent leurs mains devant les yeux, ceux qui doutent, mais qui se jettent quand même à l’eau. Ceux qui ont peur de se tromper, mais qui se disent YOLO. On a des points communs, c’est sûrement pour ça qu’ils me font confiance. Un jour, la propriétaire de ce bridge a osé. Vraiment osé : une belle serviette de bain, une agrafeuse de bureau… et hop, fauteuil retapissé. Le résultat n’était pas si mal, mais ce beau bridge méritait mieux. Adieu la serviette de plage : aujourd'hui, il se pare de ce superbe tissu au style Memphis, pile à la hauteur de son audace ✨",
        details: [
            "Style Memphis rétro et graphique",
            "Tissu Odyssée de chez Camengo",
            "Structure bois restaurée"
        ]
    },
    {
        id: 3,
        title: "Bridges Pauline",
        image: piece3,
        description: "Le léopard, on en voit partout… Réveillez le tigre qui est en vous ! Restauration de fauteuils vintage avec réfection complète et tissu ultra coloré. Le bois a été conservé, l'assise a été refaite, et surtout ce tissu complètement fou de chez Clarke&Clarke transforme ces fauteuils en véritables pièces de décoration fortes.",
        details: [
            "Assises refaites à neuf",
            "Tissu graphique Clarke & Clarke",
            "Structure en bois conservée et sublimée"
        ]
    },
];

export default function Realisations() {
    const { showToast } = useToast();
    const { isEditMode } = useEditMode();
    const [selectedItem, setSelectedItem] = useState(null);
    const [realisationsData, setRealisationsData] = useState(DEFAULT_REALISATIONS);

    const loadContent = async () => {
        const { itemsBySection } = await fetchSiteContent('realisations');
        const rows = getItems(itemsBySection, 'item', null);
        if (!rows) return;
        setRealisationsData(rows.map((row, idx) => ({
            id: row.id,
            title: row.title,
            image: row.image_url || FALLBACK_LOCAL_IMAGES[idx] || FALLBACK_LOCAL_IMAGES[0],
            imageUrl: row.image_url,
            description: row.text_value,
            details: row.extra?.details || [],
            sortOrder: row.sort_order,
        })));
    };

    useEffect(() => { loadContent(); }, []);

    const updateItem = async (id, patch) => {
        try {
            const { error } = await supabase.from('site_content').update(patch).eq('id', id);
            if (error) throw error;
            setRealisationsData((prev) => prev.map((item) => (item.id === id ? {
                ...item,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.text_value !== undefined ? { description: patch.text_value } : {}),
                ...(patch.image_url !== undefined ? { image: patch.image_url, imageUrl: patch.image_url } : {}),
                ...(patch.extra !== undefined ? { details: patch.extra.details || [] } : {}),
            } : item)));
            showToast('Enregistré', 'success');
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        }
    };

    const handleImageUpload = async (id, file) => {
        const item = realisationsData.find((i) => i.id === id);
        const newUrl = await uploadImageToBucket(supabase, BUCKET, file);
        await updateItem(id, { image_url: newUrl });
        if (item?.imageUrl) await removeImageFromBucket(supabase, BUCKET, item.imageUrl);
    };

    const addItem = async () => {
        const nextOrder = realisationsData.length > 0 ? Math.max(...realisationsData.map((i) => i.sortOrder || 0)) + 1 : 0;
        const { data, error } = await supabase.from('site_content').insert([{
            page: 'realisations', section: 'item', kind: 'list_item', title: 'Nouvelle réalisation', text_value: '', extra: { details: [] }, sort_order: nextOrder,
        }]).select('id').single();
        if (error) { showToast("Erreur lors de l'ajout : " + error.message, 'error'); return; }
        setRealisationsData((prev) => [...prev, {
            id: data.id, title: 'Nouvelle réalisation', image: FALLBACK_LOCAL_IMAGES[0], imageUrl: null, description: '', details: [], sortOrder: nextOrder,
        }]);
    };

    const deleteItem = async (item) => {
        if (item.imageUrl) await removeImageFromBucket(supabase, BUCKET, item.imageUrl);
        const { error } = await supabase.from('site_content').delete().eq('id', item.id);
        if (error) { showToast('Erreur lors de la suppression : ' + error.message, 'error'); return; }
        setRealisationsData((prev) => prev.filter((i) => i.id !== item.id));
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24">
            <Helmet>
                <title>Réalisations — Portfolio de Tapisserie | Atelier Gesta</title>
                <meta name="description" content="Portfolio de créations de l'Atelier Gesta : sièges rénovés, rideaux sur-mesure, pièces uniques. Découvrez le savoir-faire de Mathilde." />
            </Helmet>
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">

                <header className="mb-32">
                    <h1 className="font-editorial text-7xl sm:text-9xl tracking-tighter mix-blend-difference">
                        <EditableText page="realisations" section="page_title" fallback="Réalisations." as="span" multiline={false} />
                    </h1>
                </header>

                {/* Asymmetrical / Disorganized Editorial Layout */}
                <div className="flex flex-col space-y-32 md:space-y-48 pb-32">
                    {realisationsData.map((item, index) => {

                        // Break the grid: customize width, alignment, and margins for each item
                        let rowClass = "md:flex-row items-center";
                        let imgWidthClass = "md:w-1/2 lg:w-[45%]";
                        let offsetClass = "";

                        if (index === 1) {
                            rowClass = "md:flex-row-reverse items-start";
                            imgWidthClass = "md:w-3/5 lg:w-[60%]";
                            offsetClass = "md:-mt-32";
                        } else if (index === 2) {
                            rowClass = "md:flex-row items-end";
                            imgWidthClass = "md:w-1/2 lg:w-[40%]";
                            offsetClass = "md:pl-24 lg:pl-64 md:mt-16";
                        }

                        return (
                            <div
                                key={item.id}
                                className={`relative group flex flex-col ${rowClass} gap-12 lg:gap-24 ${offsetClass}`}
                            >
                                <DeleteItemButton onDelete={() => deleteItem(item)} label="Supprimer cette réalisation" />
                                <div className={`w-full ${imgWidthClass} overflow-hidden cursor-pointer`} onClick={() => !isEditMode && setSelectedItem(item)}>
                                    <InlineEditableImage
                                        src={item.image}
                                        alt={item.title}
                                        onUpload={(file) => handleImageUpload(item.id, file)}
                                        imgClassName="w-full aspect-[4/5] object-cover filter grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100"
                                    />
                                </div>
                                <div className="w-full md:flex-1 flex flex-col justify-center cursor-pointer" onClick={() => !isEditMode && setSelectedItem(item)}>
                                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                                        0{index + 1}
                                    </span>
                                    <InlineEditable
                                        value={item.title}
                                        onCommit={(v) => updateItem(item.id, { title: v })}
                                        as="h2"
                                        className="font-editorial text-4xl lg:text-7xl leading-tight mb-8"
                                        multiline={false}
                                    />
                                    <span className="font-mono text-sm tracking-widest text-primary hover:underline underline-offset-4">
                                        Explorer le projet
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <AddItemTile onAdd={addItem} label="Ajouter une réalisation" className="mb-32" />
            </div>

            <MinimalModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                editable={selectedItem ? {
                    onSaveTitle: (v) => updateItem(selectedItem.id, { title: v }),
                    onSaveDescription: (v) => updateItem(selectedItem.id, { text_value: v }),
                    onSaveDetails: (details) => updateItem(selectedItem.id, { extra: { details } }),
                    onSaveImage: (file) => handleImageUpload(selectedItem.id, file),
                } : null}
            />
        </div>
    );
}
