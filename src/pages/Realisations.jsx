import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MinimalModal from '../components/UI/MinimalModal';
import piece1 from '../assets/piece_1.webp';
import piece2 from '../assets/piece_2.webp';
import piece3 from '../assets/piece_3.webp';

const realisationsData = [
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
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24">
            <Helmet>
                <title>Réalisations — Portfolio de Tapisserie | Atelier Gesta</title>
                <meta name="description" content="Portfolio de créations de l'Atelier Gesta : sièges rénovés, rideaux sur-mesure, pièces uniques. Découvrez le savoir-faire de Mathilde." />
            </Helmet>
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">

                <header className="mb-32">
                    <h1 className="font-editorial text-7xl sm:text-9xl tracking-tighter mix-blend-difference">
                        Réalisations.
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
                            // Second item: Huge image, flush right, pulls up to overlap space
                            rowClass = "md:flex-row-reverse items-start";
                            imgWidthClass = "md:w-3/5 lg:w-[60%]";
                            offsetClass = "md:-mt-32";
                        } else if (index === 2) {
                            // Third item: Smaller image, pushed to the center/right
                            rowClass = "md:flex-row items-end";
                            imgWidthClass = "md:w-1/2 lg:w-[40%]";
                            offsetClass = "md:pl-24 lg:pl-64 md:mt-16";
                        }

                        return (
                            <div
                                key={item.id}
                                className={`flex flex-col ${rowClass} gap-12 lg:gap-24 group cursor-pointer ${offsetClass}`}
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className={`w-full ${imgWidthClass} overflow-hidden`}>
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full aspect-[4/5] object-cover filter grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="w-full md:flex-1 flex flex-col justify-center">
                                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                                        0{index + 1}
                                    </span>
                                    <h2 className="font-editorial text-4xl lg:text-7xl leading-tight mb-8">
                                        {item.title}
                                    </h2>
                                    <span className="font-mono text-sm tracking-widest text-primary hover:underline underline-offset-4">
                                        Explorer le projet
                                    </span>
                                </div>
                            </div>
                        );
                    })}
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
