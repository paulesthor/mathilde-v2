import { useState } from 'react';
import MinimalModal from '../components/UI/MinimalModal';

const realisationsData = [
    {
        id: 1,
        title: "Fauteuil Voltaire",
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1200",
        description: "Restauration complète de l'assise avec une garniture traditionnelle. Contraste fort entre le bois noir goudron et le tissu floral exubérant de la maison Pierre Frey.",
        details: ["Garniture traditionnelle", "Tissu Pierre Frey", "Clous apparents noirs"]
    },
    {
        id: 2,
        title: "Chaises Médaillon",
        image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=1200",
        description: "Le bois brut contrastant avec un luxueux velours de mohair bleu profond. Une réinterprétation minimaliste d'un grand classique Louis XVI.",
        details: ["Aérogommage bois brut", "Velours Mohair", "Passepoil ton sur ton"]
    },
    {
        id: 3,
        title: "Banquette Napoléon III",
        image: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=1200",
        description: "Création d'une assise sur mesure. Le tissu géométrique structure cette pièce ancienne et l'ancre résolument dans l'époque contemporaine.",
        details: ["Mousse HR", "Tissu géométrique Dedar"]
    },
];

export default function Realisations() {
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24">
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
