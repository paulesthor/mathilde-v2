import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import MinimalModal from '../components/UI/MinimalModal';
import { fetchSiteContent, getItems, getCachedSiteContent } from '../lib/siteContent';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { useEditMode } from '../contexts/EditModeContext';
import { uploadImageToBucket, removeImageFromBucket } from '../lib/imageUpload';
import EditableText from '../components/Editable/EditableText';
import InlineEditable from '../components/Editable/InlineEditable';
import InlineEditableImage from '../components/Editable/InlineEditableImage';
import { AddItemTile, DeleteItemButton } from '../components/Editable/EditableListControls';

const BUCKET = 'site-content';

const DEFAULT_CREATIONS = [
    {
        id: 1,
        title: "Coussin Plissé",
        image: "https://images.unsplash.com/photo-1574044199960-4fed290d2fd2?auto=format&fit=crop&q=80&w=1000",
        description: "Coussin décoratif réalisé avec un plissé main technique. Une exploration des volumes textiles.",
        details: ["Velours de coton", "Plissé fait main"]
    },
    {
        id: 2,
        title: "Tête de Lit 'Aube'",
        image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=1000",
        description: "Création sur-mesure d'une tête de lit capitonnée, pensée pour s'intégrer parfaitement dans une chambre aux tons minéraux.",
        details: ["Lin lavé froissé", "Capitonnage diamant"]
    },
    {
        id: 3,
        title: "Banette de Fenêtre",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1000",
        description: "Aménagement d'une alcôve avec des coussins sur-mesure pour créer un coin lecture lumineux et graphique.",
        details: ["Laine bouillie", "Sur-mesure total"]
    }
];

function mapCreationRow(row) {
    return {
        id: row.id,
        title: row.title,
        image: row.image_url,
        description: row.text_value,
        details: row.extra?.details || [],
        sortOrder: row.sort_order,
    };
}

export default function Creations() {
    const { showToast } = useToast();
    const { isEditMode } = useEditMode();
    const [selectedItem, setSelectedItem] = useState(null);
    // Démarre avec le dernier contenu connu (cache local) plutôt que les
    // photos par défaut, pour éviter le flash "anciennes photos -> vraies
    // photos" au chargement / rafraîchissement de la page.
    const [creationsData, setCreationsData] = useState(() => {
        const rows = getItems(getCachedSiteContent('creations'), 'item', null);
        return rows ? rows.map(mapCreationRow) : DEFAULT_CREATIONS;
    });

    useEffect(() => {
        const loadContent = async () => {
            const { itemsBySection } = await fetchSiteContent('creations');
            const rows = getItems(itemsBySection, 'item', null);
            if (!rows) return;
            setCreationsData(rows.map(mapCreationRow));
        };
        loadContent();
    }, []);

    const updateItem = async (id, patch) => {
        try {
            const { error } = await supabase.from('site_content').update(patch).eq('id', id);
            if (error) throw error;
            setCreationsData((prev) => prev.map((item) => (item.id === id ? {
                ...item,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.text_value !== undefined ? { description: patch.text_value } : {}),
                ...(patch.image_url !== undefined ? { image: patch.image_url } : {}),
                ...(patch.extra !== undefined ? { details: patch.extra.details || [] } : {}),
            } : item)));
            showToast('Enregistré', 'success');
        } catch (err) {
            showToast('Erreur : ' + err.message, 'error');
        }
    };

    const handleImageUpload = async (id, file) => {
        const item = creationsData.find((i) => i.id === id);
        const newUrl = await uploadImageToBucket(supabase, BUCKET, file);
        await updateItem(id, { image_url: newUrl });
        if (item?.image && item.image.includes(BUCKET)) await removeImageFromBucket(supabase, BUCKET, item.image);
    };

    const addItem = async () => {
        const nextOrder = creationsData.length > 0 ? Math.max(...creationsData.map((i) => i.sortOrder || 0)) + 1 : 0;
        const { data, error } = await supabase.from('site_content').insert([{
            page: 'creations', section: 'item', kind: 'list_item', title: 'Nouvelle création', text_value: '', extra: { details: [] }, sort_order: nextOrder,
        }]).select('id').single();
        if (error) { showToast("Erreur lors de l'ajout : " + error.message, 'error'); return; }
        setCreationsData((prev) => [...prev, {
            id: data.id, title: 'Nouvelle création', image: null, description: '', details: [], sortOrder: nextOrder,
        }]);
    };

    const deleteItem = async (item) => {
        if (item.image && item.image.includes(BUCKET)) await removeImageFromBucket(supabase, BUCKET, item.image);
        const { error } = await supabase.from('site_content').delete().eq('id', item.id);
        if (error) { showToast('Erreur lors de la suppression : ' + error.message, 'error'); return; }
        setCreationsData((prev) => prev.filter((i) => i.id !== item.id));
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24 text-foreground">
            <Helmet>
                <title>Créations Inédites | Atelier Gesta</title>
                <meta name="description" content="Créations textiles originales de l'Atelier Gesta : coussins, têtes de lit et pièces sur-mesure imaginées par Mathilde." />
            </Helmet>
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                <header className="mb-24 md:mb-32">
                    <h1 className="font-editorial text-6xl md:text-9xl tracking-tighter mix-blend-difference">
                        <EditableText page="creations" section="page_title" fallback="Créations Inédites." as="span" multiline={false} />
                    </h1>
                </header>

                {/* Editorial Lookbook Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
                    {creationsData.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`relative group flex flex-col ${idx === 1 ? 'md:mt-32' : ''}`}
                        >
                            <DeleteItemButton onDelete={() => deleteItem(item)} label="Supprimer cette création" />
                            <div className="overflow-hidden mb-8 bg-muted cursor-pointer" onClick={() => !isEditMode && setSelectedItem(item)}>
                                <InlineEditableImage
                                    src={item.image}
                                    alt={item.title}
                                    onUpload={(file) => handleImageUpload(item.id, file)}
                                    imgClassName="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                            </div>
                            <div className="flex items-baseline justify-between cursor-pointer" onClick={() => !isEditMode && setSelectedItem(item)}>
                                <InlineEditable
                                    value={item.title}
                                    onCommit={(v) => updateItem(item.id, { title: v })}
                                    as="h3"
                                    className="font-editorial text-3xl group-hover:text-primary transition-colors"
                                    multiline={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <AddItemTile onAdd={addItem} label="Ajouter une création" className="mt-12" />
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
