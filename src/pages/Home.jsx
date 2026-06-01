import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin, Star } from 'lucide-react';
import HeroCarousel from '../components/UI/HeroCarousel';
import portraitMathilde from '../assets/portrait_mathilde.png';
import { supabase } from '../utils/supabaseClient';

const REVIEWS = [
    { author_name: "Pauline R.", content: "Un travail remarquable sur mes bridges vintage. Le tissu est sublime et les finitions irréprochables. Une véritable artiste !", rating: 5, source: "local", status: "approved" },
    { author_name: "Victor C.", content: "La colonne de tabourets est devenue la pièce maîtresse de notre salon. Esthétique, ingénieuse et colorée.", rating: 5, source: "local", status: "approved" },
    { author_name: "Allison D.", content: "Mathilde a redonné vie à notre fauteuil de famille avec une sensibilité incroyable. Le style Memphis lui va à ravir !", rating: 5, source: "local", status: "approved" },
    { author_name: "Marc L.", content: "Une créativité débordante alliée à un savoir-faire traditionnel impeccable. Je recommande vivement l'Atelier Gesta.", rating: 5, source: "local", status: "approved" }
];

export default function Home() {
    const [reviews, setReviews] = useState(REVIEWS);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form fields
    const [authorName, setAuthorName] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const loadReviews = async () => {
            try {
                const envUrl = import.meta.env.VITE_SUPABASE_URL;
                const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                if (!envUrl || !envKey) {
                    throw new Error("Clés Supabase absentes");
                }

                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                if (data && data.length > 0) {
                    setReviews(data);
                } else {
                    const localData = localStorage.getItem('gesta_reviews');
                    if (localData) {
                        const parsed = JSON.parse(localData).filter(r => r.status === 'approved');
                        if (parsed.length > 0) setReviews(parsed);
                    }
                }
            } catch (err) {
                console.warn("Fallback local storage:", err.message);
                const localData = localStorage.getItem('gesta_reviews');
                if (localData) {
                    const parsed = JSON.parse(localData).filter(r => r.status === 'approved');
                    if (parsed.length > 0) setReviews(parsed);
                }
            }
        };
        loadReviews();
    }, []);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!authorName || !content) return;
        setIsSubmitting(true);

        const newReview = {
            author_name: authorName,
            content,
            rating: parseInt(rating),
            status: 'pending',
            source: 'local',
            created_at: new Date().toISOString()
        };

        try {
            const envUrl = import.meta.env.VITE_SUPABASE_URL;
            const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (!envUrl || !envKey) {
                const localData = localStorage.getItem('gesta_reviews') || JSON.stringify(REVIEWS);
                const parsed = JSON.parse(localData);
                const simulatedObj = { ...newReview, id: Date.now().toString() };
                localStorage.setItem('gesta_reviews', JSON.stringify([simulatedObj, ...parsed]));
            } else {
                const { error } = await supabase
                    .from('reviews')
                    .insert([newReview]);
                if (error) throw error;
            }
            
            setSubmitSuccess(true);
            setAuthorName('');
            setContent('');
            setRating(5);
            setTimeout(() => {
                setSubmitSuccess(false);
                setIsFormOpen(false);
            }, 4000);
        } catch (err) {
            alert("Erreur lors de l'envoi : " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-1000">

            {/* ─── HERO EDITORIAL ─── */}
            <section className="hero-section">

                {/* Arrière-plan texture très légère */}
                <div className="hero-bg-grain" />

                <div className="hero-inner">

                    {/* ── COLONNE GAUCHE : portrait propriétaire ── */}
                    <div className="hero-portrait-col">
                        <div className="hero-portrait-frame">
                            <img
                                src={portraitMathilde}
                                alt="Mathilde, fondatrice de l'Atelier Gesta"
                                className="hero-portrait-img"
                            />
                            {/* overlay très léger */}
                            <div className="hero-portrait-overlay" />
                        </div>

                        {/* Nom flottant sous le portrait, légèrement décalé */}
                        <div className="hero-portrait-credit">
                            <span className="hero-portrait-name">Mathilde</span>
                            <span className="hero-portrait-role">Artisane Tapissière · Atelier Gesta</span>
                        </div>
                    </div>

                    {/* ── COLONNE CENTRALE : texte éditorial ── */}
                    <div className="hero-text-col">
                        <p className="hero-eyebrow">Atelier de Tapisserie d'Ameublement</p>
                        <h1 className="hero-h1">
                            Adopter une décoration qui vous ressemble et faites revenir la couleur dans votre intérieur.
                        </h1>
                        <div className="hero-contact-card">
                            <div className="hero-contact-block">
                                <span className="hero-contact-line">
                                    <MapPin className="hero-contact-icon" />
                                    Paris — Uniquement sur RDV
                                </span>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hero-contact-insta"
                                >
                                    <Instagram className="hero-contact-icon" />
                                    @gesta_studio
                                </a>
                            </div>
                        </div>
                        <Link to="/about" className="hero-cta">
                            Découvrir l'Atelier
                        </Link>
                    </div>

                    {/* ── COLONNE DROITE : carrousel ── */}
                    <div className="hero-carousel-col">
                        <HeroCarousel />
                    </div>
                </div>

                {/* Ligne décorative bas-de-page éditoriale */}
                <div className="hero-bottom-rule" />
            </section>

            {/* ─── SECTION CITATION ÉDITORIALE ─── */}
            <section className="editorial-section">
                <div className="editorial-inner">
                    <h2 className="editorial-h2">
                        Allier savoir-faire artisanal, sensibilité esthétique et approche contemporaine du mobilier.
                    </h2>
                    <div className="mt-16">
                        <Link to="/about" className="editorial-link">
                            Découvrir l'Atelier
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── SECTION AVIS CLIENTS ─── */}
            <section className="reviews-section py-24 border-t border-border/60 overflow-hidden bg-muted/10">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12 mb-16">
                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                        Témoignages
                    </span>
                    <h2 className="font-editorial text-4xl md:text-6xl mt-4">
                        Ils font confiance à l'Atelier.
                    </h2>
                </div>
                
                <div className="relative w-full overflow-hidden flex py-4">
                    <div className="flex gap-8 animate-marquee whitespace-nowrap">
                        {[...reviews, ...reviews].map((review, idx) => (
                            <div 
                                key={idx} 
                                className="inline-block w-[350px] md:w-[450px] shrink-0 bg-background border border-border/80 p-8 rounded-lg shadow-sm hover:border-primary transition-colors duration-500 whitespace-normal"
                            >
                                <div className="flex gap-1 text-primary mb-4">
                                    {Array.from({ length: review.rating || 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                                    ))}
                                </div>
                                <p className="font-sans font-light text-base md:text-lg text-foreground italic leading-relaxed mb-6">
                                    "{review.content}"
                                </p>
                                
                                <div className="flex items-center gap-3">
                                    {review.author_photo_url ? (
                                        <img 
                                            src={review.author_photo_url} 
                                            alt={review.author_name} 
                                            className="w-8 h-8 rounded-full object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs uppercase text-primary">
                                            {review.author_name ? review.author_name.charAt(0) : 'A'}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-editorial text-lg leading-none">
                                            {review.author_name}
                                        </span>
                                        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1">
                                            {review.source === 'google' ? 'Google Reviews' : 'Avis site'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formulaire pour laisser un avis */}
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12 mt-16 flex flex-col items-center">
                    {!isFormOpen ? (
                        <button 
                            onClick={() => setIsFormOpen(true)}
                            className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/50 pb-1 hover:text-foreground hover:border-foreground transition-all duration-300"
                        >
                            Laisser un avis à l'Atelier
                        </button>
                    ) : (
                        <div className="w-full max-w-xl border border-border/80 bg-background p-8 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg">
                            {submitSuccess ? (
                                <div className="text-center py-6 text-emerald-600 font-mono text-xs uppercase tracking-wider">
                                    ✓ Merci ! Votre avis a été soumis et sera visible après modération.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitReview} className="space-y-6">
                                    <h3 className="font-editorial text-2xl">Laisser un avis.</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Votre nom</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={authorName} 
                                                onChange={(e) => setAuthorName(e.target.value)} 
                                                className="w-full bg-muted/10 border border-border/80 px-4 py-2 font-sans text-sm focus:border-primary outline-none transition-colors"
                                                placeholder="Ex: Sophie M."
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Note</label>
                                            <select 
                                                value={rating} 
                                                onChange={(e) => setRating(e.target.value)} 
                                                className="w-full bg-muted/10 border border-border/80 px-4 py-2 font-mono text-sm focus:border-primary outline-none transition-colors"
                                            >
                                                <option value="5">5 Étoiles</option>
                                                <option value="4">4 Étoiles</option>
                                                <option value="3">3 Étoiles</option>
                                                <option value="2">2 Étoiles</option>
                                                <option value="1">1 Étoile</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Message</label>
                                        <textarea 
                                            required 
                                            value={content} 
                                            onChange={(e) => setContent(e.target.value)} 
                                            rows={3} 
                                            className="w-full bg-muted/10 border border-border/80 px-4 py-2 font-sans text-sm focus:border-primary outline-none resize-none transition-colors"
                                            placeholder="Partagez votre expérience sur votre projet..."
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex-1 bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest py-3 transition-colors"
                                        >
                                            {isSubmitting ? 'Envoi...' : 'Envoyer'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsFormOpen(false)}
                                            className="px-5 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── BANDEAU CTA ─── */}
            <section className="cta-section">
                <div className="cta-inner">
                    <h2 className="cta-h2">
                        Vous avez un projet de restauration ou de confection ?
                    </h2>
                    <Link to="/contact" className="cta-btn">
                        Discutons-en
                    </Link>
                </div>
            </section>

        </div>
    );
}
