import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import MinimalModal from '../components/UI/MinimalModal';
import { fetchSiteContent, getItems } from '../lib/siteContent';

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

export default function Creations() {
    const [selectedItem, setSelectedItem] = useState(null);
    const [creationsData, setCreationsData] = useState(DEFAULT_CREATIONS);

    useEffect(() => {
        const loadContent = async () => {
            const { itemsBySection } = await fetchSiteContent('creations');
            const rows = getItems(itemsBySection, 'item', null);
            if (!rows) return;
            setCreationsData(rows.map((row) => ({
                id: row.id,
                title: row.title,
                image: row.image_url,
                description: row.text_value,
                details: row.extra?.details || [],
            })));
        };
        loadContent();
    }, []);

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24 text-foreground">
            <Helmet>
                <title>Créations Inédites | Atelier Gesta</title>
                <meta name="description" content="Créations textiles originales de l'Atelier Gesta : coussins, têtes de lit et pièces sur-mesure imaginées par Mathilde." />
            </Helmet>
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                <header className="mb-24 md:mb-32">
                    <h1 className="font-editorial text-6xl md:text-9xl tracking-tighter mix-blend-difference">
                        Créations <br /> <span className="italic text-primary">Inédites.</span>
                    </h1>
                </header>

                {/* Editorial Lookbook Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
                    {creationsData.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`group cursor-pointer flex flex-col ${idx === 1 ? 'md:mt-32' : ''}`}
                            onClick={() => setSelectedItem(item)}
                        >
                            <div className="overflow-hidden mb-8 bg-muted">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex items-baseline justify-between">
                                <h3 className="font-editorial text-3xl group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <MinimalModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    );
}
