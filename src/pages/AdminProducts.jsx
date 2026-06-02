import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Check, Trash, Plus, Archive, Star, Database, Sparkles, ShoppingBag } from 'lucide-react';

const DEFAULT_PRODUCTS = [
    { id: '1', title: "Chauffeuse 70s", price: 450, description: "Chauffeuse des années 70 entièrement rhabillée avec un tissu bouclette très contemporain.", image_url: "https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=1000", status: "available", stripe_payment_link: "https://buy.stripe.com/test_8x24gB6Qa35M4t1fp20RG00", created_at: new Date().toISOString() },
    { id: '2', title: "Paire de Bridge", price: 890, description: "Paire de fauteuils bridge fifties. Le contraste entre le chêne clair et le velours forêt met en valeur l'architecture des sièges.", image_url: "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&q=80&w=1000", status: "available", stripe_payment_link: "https://buy.stripe.com/test_8x24gB6Qa35M4t1fp20RG00", created_at: new Date().toISOString() },
    { id: '3', title: "Lampe Abat-jour Plissé", price: 180, description: "Pied de lampe vintage en laiton associé à un abat-jour entièrement plissé main à l'atelier.", image_url: "https://images.unsplash.com/photo-1507646873528-984bb365774a?auto=format&fit=crop&q=80&w=1000", status: "available", stripe_payment_link: "https://buy.stripe.com/test_8x24gB6Qa35M4t1fp20RG00", created_at: new Date().toISOString() }
];

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUsingMock, setIsUsingMock] = useState(false);
    const navigate = useNavigate();


    // Form fields
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const envUrl = import.meta.env.VITE_SUPABASE_URL;
            const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!envUrl || !envKey) {
                throw new Error("Variables .env manquantes");
            }

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                // Populate database with defaults if empty
                const { error: insertError } = await supabase
                    .from('products')
                    .insert(DEFAULT_PRODUCTS.map(({ id, ...rest }) => rest));
                if (!insertError) {
                    const { data: refetched } = await supabase
                        .from('products')
                        .select('*')
                        .order('created_at', { ascending: false });
                    setProducts(refetched || []);
                } else {
                    setProducts([]);
                }
            } else {
                setProducts(data);
            }
            setIsUsingMock(false);
        } catch (err) {
            console.warn("Using fallback local storage for products:", err.message);
            const localData = localStorage.getItem('gesta_products');
            if (localData) {
                setProducts(JSON.parse(localData));
            } else {
                localStorage.setItem('gesta_products', JSON.stringify(DEFAULT_PRODUCTS));
                setProducts(DEFAULT_PRODUCTS);
            }
            setIsUsingMock(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Change status (available, sold, archived)
    const updateStatus = async (id, status) => {
        if (isUsingMock) {
            const updated = products.map(p => p.id === id ? { ...p, status } : p);
            setProducts(updated);
            localStorage.setItem('gesta_products', JSON.stringify(updated));
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (err) {
            alert("Erreur lors de la mise à jour : " + err.message);
        }
    };

    // Delete product
    const deleteProduct = async (id) => {
        if (confirm("Voulez-vous vraiment supprimer cet article ?")) {
            if (isUsingMock) {
                const updated = products.filter(p => p.id !== id);
                setProducts(updated);
                localStorage.setItem('gesta_products', JSON.stringify(updated));
                return;
            }

            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchProducts();
            } catch (err) {
                alert("Erreur lors de la suppression : " + err.message);
            }
        }
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !price) return;
        setSubmitting(true);

        const parsedPrice = parseFloat(price);

        if (isUsingMock) {
            // Simulation mode: automatically create a fake Stripe link
            const newProduct = {
                id: Date.now().toString(),
                title,
                price: parsedPrice,
                description,
                image_url: imageUrl || "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1200",
                status: 'available',
                stripe_payment_link: "https://buy.stripe.com/test_8x24gB6Qa35M4t1fp20RG00", // using our working test link as mock!
                created_at: new Date().toISOString()
            };
            const updated = [newProduct, ...products];
            setProducts(updated);
            localStorage.setItem('gesta_products', JSON.stringify(updated));
            alert("Produit ajouté avec succès (Lien Stripe simulé) !");
            setSubmitting(false);
            setTitle('');
            setPrice('');
            setDescription('');
            setImageUrl('');
        } else {
            try {
                // Call Supabase Edge Function to generate Stripe link
                console.log("Calling Edge Function create-stripe-link...");
                const { data: stripeData, error: funcError } = await supabase.functions.invoke('create-stripe-link', {
                    body: {
                        title,
                        price: parsedPrice,
                        description,
                        image_url: imageUrl || undefined
                    }
                });

                if (funcError) throw new Error("Impossible de générer le lien Stripe: " + funcError.message);

                // Insert into products table
                const { error: dbError } = await supabase
                    .from('products')
                    .insert([{
                        title,
                        price: parsedPrice,
                        description,
                        image_url: imageUrl || "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1200",
                        stripe_payment_link: stripeData.payment_link,
                        stripe_product_id: stripeData.stripe_product_id,
                        status: 'available'
                    }]);

                if (dbError) throw dbError;

                alert("Produit créé avec succès dans votre catalogue et sur Stripe !");
                fetchProducts();
                setTitle('');
                setPrice('');
                setDescription('');
                setImageUrl('');
            } catch (err) {
                alert("Erreur lors de la création : " + err.message + "\n\nNote : Assurez-vous que l'Edge Function 'create-stripe-link' est déployée et configurée.");
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleLogout = async () => {
        if (isUsingMock) {
            localStorage.removeItem('gesta_admin_logged_in');
            navigate('/');
        } else {
            await supabase.auth.signOut();
            navigate('/');
        }
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen pt-32 pb-24 text-foreground">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">

                {/* Internal Admin Navigation Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 border border-border/50 px-6 py-4 rounded-lg mb-12 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="font-bold text-primary tracking-widest uppercase">Gesta Admin</span>
                        <span className="text-muted-foreground/30 hidden sm:inline">|</span>
                        <Link to="/admin/products" className="hover:text-primary transition-colors font-bold underline underline-offset-4">Catalogue</Link>
                        <Link to="/admin/reviews" className="hover:text-primary transition-colors text-muted-foreground hover:underline underline-offset-4">Modération Avis</Link>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-wider text-[10px]"
                    >
                        Se déconnecter
                    </button>
                </div>
                
                <header className="mb-16 border-b border-border/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                            Espace Boutique
                        </span>
                        <h1 className="font-editorial text-5xl md:text-7xl mt-4">
                            Gestion du catalogue.
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/30 border border-border/80 px-4 py-3 rounded-lg">
                        <Database className={`h-5 w-5 ${isUsingMock ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className="font-mono text-xs uppercase tracking-widest">
                            {isUsingMock ? 'Mode Simulation' : 'Supabase Connecté'}
                        </span>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-16">
                    
                    {/* Colonne Gauche : Formulaire de création */}
                    <div className="w-full lg:w-1/3">
                        <div className="border border-border/80 p-8 rounded-lg bg-muted/5">
                            <h2 className="font-editorial text-3xl mb-8 flex items-center gap-3">
                                <Plus className="h-6 w-6 text-primary" />
                                Ajouter une pièce
                            </h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Nom du produit *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                                        placeholder="Ex: Chauffeuse 70s"
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Prix (en EUR) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                                        placeholder="Ex: 450"
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Lien de la photo
                                    </label>
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none resize-none transition-colors"
                                        placeholder="Détails du tissu, des dimensions, de l'année..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest py-4 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Génération sur Stripe..." : "Publier l'article"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Colonne Droite : Liste du catalogue */}
                    <div className="w-full lg:w-2/3">
                        <h2 className="font-editorial text-3xl mb-8 flex items-center gap-3">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                            Catalogue actuel
                        </h2>

                        {loading ? (
                            <p className="font-mono text-sm tracking-widest py-12">Chargement...</p>
                        ) : products.length === 0 ? (
                            <div className="border border-dashed border-border py-16 text-center rounded-lg">
                                <p className="font-sans font-light text-muted-foreground">Votre boutique est vide.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {products.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className="border border-border/80 bg-muted/10 p-6 rounded-lg flex flex-col justify-between hover:border-foreground/40 transition-colors"
                                    >
                                        <div>
                                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted mb-4">
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    <span className={`px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest rounded-full ${
                                                        product.status === 'available' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                            : product.status === 'sold' 
                                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                    }`}>
                                                        {product.status === 'available' && 'En vente'}
                                                        {product.status === 'sold' && 'Vendu'}
                                                        {product.status === 'archived' && 'Archivé'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-baseline mb-2">
                                                <h3 className="font-editorial text-2xl">{product.title}</h3>
                                                <span className="font-mono text-sm font-semibold">{product.price} €</span>
                                            </div>
                                            <p className="font-sans font-light text-xs text-muted-foreground line-clamp-2 mb-4">
                                                {product.description || "Aucune description fournie."}
                                            </p>
                                        </div>

                                        <div className="border-t border-border/40 pt-4 flex justify-between items-center">
                                            <div className="flex gap-2">
                                                {product.status !== 'available' && (
                                                    <button
                                                        onClick={() => updateStatus(product.id, 'available')}
                                                        className="px-3 py-1.5 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-mono text-[10px] uppercase tracking-wider rounded"
                                                        title="Remettre en vente"
                                                    >
                                                        En vente
                                                    </button>
                                                )}
                                                {product.status !== 'sold' && (
                                                    <button
                                                        onClick={() => updateStatus(product.id, 'sold')}
                                                        className="px-3 py-1.5 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-all font-mono text-[10px] uppercase tracking-wider rounded"
                                                        title="Marquer comme vendu"
                                                    >
                                                        Vendu
                                                    </button>
                                                )}
                                                {product.status !== 'archived' && (
                                                    <button
                                                        onClick={() => updateStatus(product.id, 'archived')}
                                                        className="px-3 py-1.5 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-mono text-[10px] uppercase tracking-wider rounded"
                                                        title="Archiver l'article"
                                                    >
                                                        Archiver
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="p-2 border border-border text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all rounded"
                                                title="Supprimer définitivement"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
