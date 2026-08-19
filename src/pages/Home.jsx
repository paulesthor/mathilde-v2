import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Instagram, MapPin, Star } from 'lucide-react';
import HeroCarousel from '../components/UI/HeroCarousel';
import portraitMathilde from '../assets/portrait_mathilde.webp';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { useEditMode } from '../contexts/EditModeContext';
import EditableText from '../components/Editable/EditableText';
import EditableImage from '../components/Editable/EditableImage';

export default function Home() {
    const { showToast } = useToast();
    const { isEditMode } = useEditMode();
    const [reviews, setReviews] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form fields
    const [authorName, setAuthorName] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState(0); // Anti-spam rate limit

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
                    .select('id, author_name, content, rating, source, status')
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
            } catch {
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
        
        // Anti-spam: rate limit 1 submission per 30 seconds
        const now = Date.now();
        if (now - lastSubmitTime < 30000) {
            showToast("Veuillez patienter avant d'envoyer un autre avis.", 'info');
            return;
        }

        // Content validation
        if (authorName.length > 100) {
            showToast("Le nom est trop long (max 100 caractères).", 'error');
            return;
        }
        if (content.length < 10 || content.length > 1000) {
            showToast("L'avis doit contenir entre 10 et 1000 caractères.", 'error');
            return;
        }
        
        setIsSubmitting(true);
        setLastSubmitTime(now);

        const newReview = {
            author_name: authorName,
            content,
            rating: parseInt(rating),
            status: 'pending',
            source: 'local',
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase.functions.invoke('submit-review', {
                body: { author_name: authorName, content, rating: parseInt(rating) }
            });
            if (error) throw error;
            setSubmitSuccess(true);
            setAuthorName('');
            setContent('');
            setRating(5);
            setTimeout(() => {
                setSubmitSuccess(false);
                setIsFormOpen(false);
            }, 4000);
        } catch (err) {
            showToast("Erreur lors de l'envoi : " + err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-1000">
            <Helmet>
                <title>Atelier Gesta — Tapisserie & Création Sur-Mesure à Paris</title>
                <meta name="description" content="Atelier Gesta, tapisserie d'ameublement et création sur-mesure à Paris. Rénovation de sièges, rideaux, créations originales par Mathilde." />
            </Helmet>

            {/* ─── HERO EDITORIAL ─── */}
            <section className="hero-section">

                {/* Arrière-plan texture très légère */}
                <div className="hero-bg-grain" />

                <div className="hero-inner">

                    {/* ── COLONNE GAUCHE : portrait propriétaire ── */}
                    <div className="hero-portrait-col">
                        <div className="hero-portrait-frame">
                            <EditableImage
                                page="home"
                                section="portrait_image"
                                fallback={portraitMathilde}
                                alt="Mathilde, fondatrice de l'Atelier Gesta"
                                className="w-full h-full"
                                imgClassName="hero-portrait-img"
                            />
                            {/* overlay très léger */}
                            <div className="hero-portrait-overlay" />
                        </div>

                        {/* Nom flottant sous le portrait, légèrement décalé */}
                        <div className="hero-portrait-credit">
                            <EditableText page="home" section="portrait_name" fallback="Mathilde" as="span" className="hero-portrait-name" multiline={false} />
                            <EditableText page="home" section="portrait_role" fallback="Artisane Tapissière · Atelier Gesta" as="span" className="hero-portrait-role" multiline={false} />
                        </div>
                    </div>

                    {/* ── COLONNE CENTRALE : texte éditorial ── */}
                    <div className="hero-text-col">
                        <EditableText page="home" section="hero_eyebrow" fallback="Atelier de Tapisserie d'Ameublement" as="p" className="hero-eyebrow" multiline={false} />
                        <h1 className="hero-h1">
                            <EditableText page="home" section="hero_title" fallback="Adopter une décoration qui vous ressemble et faites revenir la couleur dans votre intérieur." as="span" />
                        </h1>
                        <div className="hero-contact-card">
                            <div className="hero-contact-block">
                                <span className="hero-contact-line">
                                    <MapPin className="hero-contact-icon" />
                                    Paris — Uniquement sur RDV
                                </span>
                                <a
                                    href="https://instagram.com/gesta_studio"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hero-contact-insta"
                                >
                                    <Instagram className="hero-contact-icon" />
                                    @gesta_studio
                                </a>
                            </div>
                        </div>
                        <Link to="/about" className="hero-cta" onClick={(e) => isEditMode && e.preventDefault()}>
                            <EditableText page="home" section="cta_about_label" fallback="Découvrir l'Atelier" as="span" multiline={false} />
                        </Link>
                    </div>
                </div>

                {/* ── Galerie photos qui défilent, en contrebas, format paysage ── */}
                <div className="hero-carousel-section">
                    <HeroCarousel />
                </div>

                {/* Ligne décorative bas-de-page éditoriale */}
                <div className="hero-bottom-rule" />
            </section>

            {/* ─── SECTION CITATION ÉDITORIALE ─── */}
            <section className="editorial-section">
                <div className="editorial-inner">
                    <h2 className="editorial-h2">
                        <EditableText page="home" section="editorial_citation" fallback="Allier savoir-faire artisanal, sensibilité esthétique et approche contemporaine du mobilier." as="span" />
                    </h2>
                    <div className="mt-16">
                        <Link to="/about" className="editorial-link" onClick={(e) => isEditMode && e.preventDefault()}>
                            <EditableText page="home" section="cta_about_label" fallback="Découvrir l'Atelier" as="span" multiline={false} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── SECTION AVIS CLIENTS ─── */}
            <section className="reviews-section py-24 border-t border-border/60 overflow-hidden bg-muted/10">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12 mb-16">
                    <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                        <EditableText page="home" section="reviews_eyebrow" fallback="Témoignages" as="span" multiline={false} />
                    </span>
                    <h2 className="font-editorial text-4xl md:text-6xl mt-4">
                        <EditableText page="home" section="reviews_heading" fallback="Ils font confiance à l'Atelier." as="span" />
                    </h2>
                </div>
                
                {reviews.length > 0 && (
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
                                            loading="lazy"
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
                )}

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
                        <EditableText page="home" section="cta_heading" fallback="Vous avez un projet de restauration ou de confection ?" as="span" />
                    </h2>
                    <Link to="/contact" className="cta-btn" onClick={(e) => isEditMode && e.preventDefault()}>
                        <EditableText page="home" section="cta_contact_label" fallback="Discutons-en" as="span" multiline={false} />
                    </Link>
                </div>
            </section>

        </div>
    );
}
