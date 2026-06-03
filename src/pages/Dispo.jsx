import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import MinimalModal from '../components/UI/MinimalModal';

const DEFAULT_PRODUCTS = [
    {
        id: '1',
        title: "Chauffeuse 70s",
        price: 450,
        image_url: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=1000",
        description: "Chauffeuse des années 70 entièrement rhabillée avec un tissu bouclette très contemporain.",
        details: ["Années 1970", "Bouclette écru", "L 60 x P 70 x H 75 cm"],
        stripe_payment_link: "#",
        status: "available"
    },
    {
        id: '2',
        title: "Paire de Bridge",
        price: 890,
        image_url: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&q=80&w=1000",
        description: "Paire de fauteuils bridge fifties. Le contraste entre le chêne clair et le velours forêt met en valeur l'architecture des sièges.",
        details: ["Années 1950", "Chêne massif", "Velours forêt"],
        stripe_payment_link: "#",
        status: "available"
    },
    {
        id: '3',
        title: "Lampe Abat-jour Plissé",
        price: 180,
        image_url: "https://images.unsplash.com/photo-1507646873528-984bb365774a?auto=format&fit=crop&q=80&w=1000",
        description: "Pied de lampe vintage en laiton associé à un abat-jour entièrement plissé main à l'atelier.",
        details: ["Laiton vintage", "Plissé main", "H 45 cm"],
        stripe_payment_link: "#",
        status: "available"
    }
];

export default function Dispo() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchAvailableProducts = async () => {
            setLoading(true);
            try {
                const envUrl = import.meta.env.VITE_SUPABASE_URL;
                const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                if (!envUrl || !envKey) {
                    throw new Error("Variables .env manquantes");
                }

                const { data, error } = await supabase
                    .from('products')
                    .select('id, title, price, description, image_url, stripe_payment_link, status')
                    .eq('status', 'available')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    setProducts(DEFAULT_PRODUCTS);
                } else {
                    setProducts(data);
                }
            } catch (err) {
                const localData = localStorage.getItem('gesta_products');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    const available = parsed.filter(p => p.status === 'available');
                    setProducts(available.length > 0 ? available : DEFAULT_PRODUCTS);
                } else {
                    setProducts(DEFAULT_PRODUCTS);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAvailableProducts();
    }, []);

    return (
        <div className="animate-in fade-in duration-1000 bg-background pt-32 pb-24 text-foreground">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                <header className="mb-24 md:mb-32 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <h1 className="font-editorial text-6xl md:text-9xl tracking-tighter mix-blend-difference">
                        Archive <br /> <span className="italic text-primary">& Pièces.</span>
                    </h1>
                    <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground w-full md:w-1/3 text-right">
                        Une sélection de pièces uniques disponibles immédiatement à l'atelier.
                    </p>
                </header>

                {loading ? (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <p className="font-mono text-sm tracking-widest">Chargement des pièces...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="min-h-[40vh] flex items-center justify-center border border-dashed border-border/60 rounded-lg">
                        <p className="font-sans font-light text-muted-foreground">Aucune pièce disponible pour le moment.</p>
                    </div>
                ) : (
                    /* Minimal Archive Grid (Staggered) */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-16 md:gap-y-32 pb-32">
                        {products.map((item, index) => {
                            // Create a staggered effect to break the rigid grid
                            let staggerClass = "";
                            if (index === 1) {
                                staggerClass = "md:mt-32 lg:mt-48";
                            } else if (index === 2) {
                                staggerClass = "lg:mt-24";
                            }

                            // Different aspect ratios for a more disorganized feel
                            const aspectClass = index === 1 ? "aspect-[3/4]" : index === 2 ? "aspect-[4/3]" : "aspect-square";
                            
                            const imageUrl = item.image || item.image_url;
                            const formattedPrice = typeof item.price === 'number' ? `${item.price} €` : item.price;

                            return (
                                <div
                                    key={item.id}
                                    className={`group cursor-pointer flex flex-col ${staggerClass}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="overflow-hidden mb-8 bg-muted relative">
                                        <img
                                            src={imageUrl}
                                            alt={item.title}
                                            className={`w-full ${aspectClass} object-cover transition-transform duration-1000 group-hover:scale-105`}
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-end p-6">
                                            <span className="font-editorial text-3xl text-white">{formattedPrice}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-mono text-sm uppercase tracking-widest group-hover:text-primary transition-colors">
                                            {item.title}
                                        </h3>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <MinimalModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    );
}
