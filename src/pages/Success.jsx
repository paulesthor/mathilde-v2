import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle } from 'lucide-react';

export default function Success() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-24">
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
