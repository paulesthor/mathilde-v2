import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Check, X, Trash, ArrowRight, MessageSquare, Star, Database } from 'lucide-react';

const MOCK_REVIEWS = [
    { id: '1', author_name: "Pauline R.", content: "Un travail remarquable sur mes bridges vintage. Le tissu est sublime et les finitions irréprochables. Une véritable artiste !", rating: 5, status: "approved", source: "local", created_at: new Date().toISOString() },
    { id: '2', author_name: "Victor C.", content: "La colonne de tabourets est devenue la pièce maîtresse de notre salon. Esthétique, ingénieuse et colorée.", rating: 5, status: "pending", source: "local", created_at: new Date().toISOString() },
    { id: '3', author_name: "Allison D.", content: "Mathilde a redonné vie à notre fauteuil de famille avec une sensibilité incroyable. Le style Memphis lui va à ravir !", rating: 4, status: "approved", source: "local", created_at: new Date().toISOString() },
    { id: '4', author_name: "Marc L.", content: "Une créativité débordante alliée à un savoir-faire traditionnel impeccable. Je recommande vivement l'Atelier Gesta.", rating: 5, status: "rejected", source: "google", created_at: new Date().toISOString() }
];

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
    const [isUsingMock, setIsUsingMock] = useState(false);
    
    // Add reviews form state
    const [newAuthor, setNewAuthor] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [newSource, setNewSource] = useState('local');

    // Fetch reviews
    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Check if credentials exist before calling Supabase
            const envUrl = import.meta.env.VITE_SUPABASE_URL;
            const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!envUrl || !envKey) {
                throw new Error("Variables .env manquantes");
            }

            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;

            if (!data || data.length === 0) {
                // Populate table if empty
                const { error: insertError } = await supabase
                    .from('reviews')
                    .insert(MOCK_REVIEWS);
                if (!insertError) {
                    const { data: refetched } = await supabase
                        .from('reviews')
                        .select('*')
                        .order('created_at', { ascending: false });
                    setReviews(refetched || []);
                } else {
                    setReviews([]);
                }
            } else {
                setReviews(data);
            }
            setIsUsingMock(false);
        } catch (err) {
            console.warn("Using fallback local storage:", err.message);
            const localData = localStorage.getItem('gesta_reviews');
            if (localData) {
                setReviews(JSON.parse(localData));
            } else {
                localStorage.setItem('gesta_reviews', JSON.stringify(MOCK_REVIEWS));
                setReviews(MOCK_REVIEWS);
            }
            setIsUsingMock(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // Update status
    const updateStatus = async (id, status) => {
        if (isUsingMock) {
            const updated = reviews.map(r => r.id === id ? { ...r, status } : r);
            setReviews(updated);
            localStorage.setItem('gesta_reviews', JSON.stringify(updated));
            return;
        }
        
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            fetchReviews();
        } catch (err) {
            alert("Erreur lors de la mise à jour: " + err.message);
        }
    };

    // Delete review
    const deleteReview = async (id) => {
        if (confirm("Voulez-vous vraiment supprimer cet avis ?")) {
            if (isUsingMock) {
                const updated = reviews.filter(r => r.id !== id);
                setReviews(updated);
                localStorage.setItem('gesta_reviews', JSON.stringify(updated));
                return;
            }
            try {
                const { error } = await supabase
                    .from('reviews')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchReviews();
            } catch (err) {
                alert("Erreur lors de la suppression: " + err.message);
            }
        }
    };

    // Add manual review
    const handleAddReview = async (e) => {
        e.preventDefault();
        if (!newAuthor || !newContent) return;

        const newReviewObj = {
            author_name: newAuthor,
            content: newContent,
            rating: parseInt(newRating),
            source: newSource,
            status: 'pending', // Starts pending
            created_at: new Date().toISOString()
        };

        if (isUsingMock) {
            const updatedObj = { ...newReviewObj, id: Date.now().toString() };
            const updated = [updatedObj, ...reviews];
            setReviews(updated);
            localStorage.setItem('gesta_reviews', JSON.stringify(updated));
        } else {
            try {
                const { error } = await supabase
                    .from('reviews')
                    .insert([newReviewObj]);
                if (error) throw error;
                fetchReviews();
            } catch (err) {
                alert("Erreur lors de l'ajout: " + err.message);
            }
        }

        // Reset fields
        setNewAuthor('');
        setNewContent('');
        setNewRating(5);
        setNewSource('local');
        alert("Avis ajouté en attente de modération !");
    };

    // Filtered list
    const filteredReviews = reviews.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen pt-32 pb-24 text-foreground">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                
                <header className="mb-16 border-b border-border/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                            Espace Modérateur
                        </span>
                        <h1 className="font-editorial text-5xl md:text-7xl mt-4">
                            Validation des avis.
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/30 border border-border/80 px-4 py-3 rounded-lg">
                        <Database className={`h-5 w-5 ${isUsingMock ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className="font-mono text-xs uppercase tracking-widest">
                            {isUsingMock ? 'Mode Simulation' : 'Supabase Connecté'}
                        </span>
                    </div>
                </header>

                {isUsingMock && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-6 rounded-lg text-sm mb-12 flex flex-col gap-2 max-w-4xl">
                        <span className="font-bold">⚠️ Mode simulation (Hors-ligne) :</span>
                        <p>
                            Aucune clé d'API Supabase n'a été configurée dans votre fichier <code>.env</code>.
                            Les avis sont stockés temporairement dans le stockage local de votre navigateur pour vous permettre de tester l'interface.
                        </p>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-16">
                    
                    {/* Colonne gauche : liste des avis */}
                    <div className="w-full lg:w-2/3">
                        <div className="flex flex-wrap gap-4 mb-8">
                            {['all', 'pending', 'approved', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-5 py-2 font-mono text-xs uppercase tracking-widest border transition-all duration-300 ${
                                        filter === status 
                                            ? 'bg-primary text-white border-primary' 
                                            : 'bg-transparent border-border hover:border-foreground'
                                    }`}
                                >
                                    {status === 'all' && 'Tous les avis'}
                                    {status === 'pending' && 'En attente'}
                                    {status === 'approved' && 'Approuvés'}
                                    {status === 'rejected' && 'Rejetés'}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <p className="font-mono text-sm tracking-widest py-12">Chargement...</p>
                        ) : filteredReviews.length === 0 ? (
                            <div className="border border-dashed border-border py-16 text-center rounded-lg">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                                <p className="font-sans font-light text-muted-foreground">Aucun avis trouvé dans cette catégorie.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredReviews.map((review) => (
                                    <div 
                                        key={review.id} 
                                        className="border border-border/80 bg-muted/10 p-8 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-foreground/40 transition-colors"
                                    >
                                        <div className="max-w-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="font-editorial text-2xl">{review.author_name}</span>
                                                <span className={`px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest rounded-full ${
                                                    review.source === 'google' 
                                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                                        : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                    {review.source}
                                                </span>
                                                <span className={`px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest rounded-full ${
                                                    review.status === 'approved' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : review.status === 'rejected' 
                                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                    {review.status === 'approved' && 'approuvé'}
                                                    {review.status === 'rejected' && 'rejeté'}
                                                    {review.status === 'pending' && 'en attente'}
                                                </span>
                                            </div>

                                            <div className="flex gap-1 text-primary mb-4">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-primary" />
                                                ))}
                                            </div>

                                            <p className="font-sans font-light text-muted-foreground leading-relaxed">
                                                "{review.content}"
                                            </p>
                                        </div>

                                        <div className="flex gap-3 shrink-0">
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => updateStatus(review.id, 'approved')}
                                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                                    title="Approuver"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => updateStatus(review.id, 'rejected')}
                                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                    title="Rejeter"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Colonne droite : Formulaire d'ajout manuel */}
                    <div className="w-full lg:w-1/3">
                        <div className="border border-border/80 p-8 rounded-lg bg-muted/5">
                            <h2 className="font-editorial text-3xl mb-8 flex items-center gap-3">
                                Simuler un avis
                            </h2>
                            
                            <form onSubmit={handleAddReview} className="space-y-6">
                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Nom de l'auteur
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newAuthor}
                                        onChange={(e) => setNewAuthor(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                                        placeholder="Ex: Sophie M."
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Note
                                    </label>
                                    <select
                                        value={newRating}
                                        onChange={(e) => setNewRating(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-mono text-sm focus:border-primary outline-none transition-colors"
                                    >
                                        {[5, 4, 3, 2, 1].map(n => (
                                            <option key={n} value={n}>{n} Étoiles</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Source
                                    </label>
                                    <select
                                        value={newSource}
                                        onChange={(e) => setNewSource(e.target.value)}
                                        className="w-full bg-background border border-border px-4 py-3 font-mono text-sm focus:border-primary outline-none transition-colors"
                                    >
                                        <option value="local">Site (Local)</option>
                                        <option value="google">Google Reviews</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                        Avis
                                    </label>
                                    <textarea
                                        required
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        rows={4}
                                        className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors resize-none"
                                        placeholder="Votre avis sur la confection..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest py-4 transition-colors"
                                >
                                    Ajouter l'avis
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
