import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Package, MapPin, Mail } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

function formatAddress(address) {
    if (!address) return null;
    const { line1, line2, postal_code, city, country } = address;
    if (!line1 && !city) return null;
    return `${line1 || ''}${line2 ? `, ${line2}` : ''} — ${postal_code || ''} ${city || ''} (${country || ''})`;
}

export default function Success() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(!!sessionId);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;

        const loadSummary = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('get-checkout-session', {
                    body: { session_id: sessionId },
                });
                if (cancelled) return;
                if (!error && data?.summary) setSummary(data.summary);
            } catch {
                // Silencieux : le message de remerciement générique reste affiché en repli.
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadSummary();
        return () => { cancelled = true; };
    }, [sessionId]);

    const address = formatAddress(summary?.shipping_address);

    return (
        <div className="min-h-full flex items-center justify-center px-6 py-24">
            <Helmet>
                <title>Commande confirmée — Atelier Gesta</title>
            </Helmet>
            <div className="max-w-lg w-full text-center space-y-8">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500" strokeWidth={1} />
                </div>
                <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Commande confirmée</p>
                    <h1 className="font-editorial text-4xl md:text-5xl">Merci pour votre confiance.</h1>
                    <p className="font-sans text-muted-foreground leading-relaxed">
                        Votre paiement a bien été reçu. Mathilde vous contactera prochainement pour convenir des modalités de livraison ou de retrait à l'atelier.
                    </p>
                    <p className="font-sans text-sm text-muted-foreground/70">
                        Un email de confirmation vous a été envoyé.
                    </p>
                </div>

                {loading && (
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                        Récupération du récapitulatif...
                    </p>
                )}

                {summary && (
                    <div className="text-left border border-border/60 rounded-lg p-6 md:p-8 bg-muted/10 space-y-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Récapitulatif de la commande
                        </p>
                        <div className="flex items-start gap-3">
                            <Package className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="font-editorial text-2xl leading-tight">{summary.product_title}</p>
                                <p className="font-mono text-sm text-primary font-bold mt-1">
                                    {summary.amount_total.toFixed(2)} €
                                </p>
                            </div>
                        </div>
                        {summary.customer_email && (
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="font-sans text-sm text-foreground/80">{summary.customer_email}</p>
                            </div>
                        )}
                        {address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="font-sans text-sm text-foreground/80 leading-relaxed">{address}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="font-mono text-xs uppercase tracking-widest py-3 px-8 bg-foreground text-background hover:bg-primary transition-colors"
                    >
                        Retour à l'accueil
                    </Link>
                    <Link
                        to="/realisations"
                        className="font-mono text-xs uppercase tracking-widest py-3 px-8 border border-border hover:border-foreground transition-colors"
                    >
                        Voir les réalisations
                    </Link>
                </div>
            </div>
        </div>
    );
}
