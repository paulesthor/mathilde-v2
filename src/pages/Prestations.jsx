import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { fetchSiteContent, getItems } from '../lib/siteContent';

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

export default function Prestations() {
    const [hoveredId, setHoveredId] = useState(null);
    const [prestationsData, setPrestationsData] = useState(DEFAULT_PRESTATIONS);

    useEffect(() => {
        const loadContent = async () => {
            const { itemsBySection } = await fetchSiteContent('prestations');
            const rows = getItems(itemsBySection, 'item', null);
            if (!rows) return;
            setPrestationsData(rows.map((row, idx) => ({
                id: row.id,
                number: String(idx + 1).padStart(2, '0'),
                title: row.title,
                description: row.text_value,
                details: row.extra?.details || [],
            })));
        };
        loadContent();
    }, []);

    return (
        <div className="animate-in fade-in duration-1000 min-h-screen bg-background pt-32 pb-24 text-foreground flex flex-col justify-center">
            <Helmet>
                <title>Rénovation de Sièges & Rideaux Sur-Mesure | Atelier Gesta</title>
                <meta name="description" content="Découvrez les prestations de l'Atelier Gesta : rénovation de sièges, rideaux sur-mesure, conseil en tissu. Artisanat parisien de qualité." />
            </Helmet>
            <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-12">

                {/* Massive section title */}
                <div className="mb-24 md:mb-32 flex justify-end">
                    <h1 className="font-editorial text-5xl md:text-8xl w-full md:w-2/3 leading-none tracking-tighter mix-blend-difference">
                        Expertise & <br /><span className="text-primary italic">Savoir-faire.</span>
                    </h1>
                </div>

                {/* Hover-driven interactive lists */}
                <div className="border-t border-border">
                    {prestationsData.map((item) => (
                        <div
                            key={item.id}
                            className="group relative border-b border-border py-12 md:py-16 flex flex-col md:flex-row items-baseline justify-between transition-colors duration-500 hover:bg-muted/50 cursor-pointer"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Left Side: Number + Title */}
                            <div className="flex items-baseline space-x-8 md:w-1/2">
                                <span className="font-mono text-xl md:text-2xl text-muted-foreground transition-colors group-hover:text-primary">
                                    {item.number}
                                </span>
                                <h2 className="font-editorial text-5xl md:text-7xl tracking-tighter transition-transform duration-500 group-hover:translate-x-4">
                                    {item.title}
                                </h2>
                            </div>

                            {/* Right Side: Details (Fades in heavily on hover/focus) */}
                            <div className="mt-8 md:mt-0 md:w-1/2 md:pl-12 flex flex-col justify-center transition-all duration-500 ease-out md:opacity-40 group-hover:opacity-100">
                                <p className="font-sans font-light text-lg md:text-xl leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors max-w-lg">
                                    {item.description}
                                </p>

                                {/* Expandable details list that shows on hover strongly on Desktop */}
                                <div className={`mt-8 overflow-hidden transition-all duration-700 ${hoveredId === item.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-0'}`}>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-sm tracking-widest uppercase">
                                        {item.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <span className="text-primary mr-2">+</span>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
