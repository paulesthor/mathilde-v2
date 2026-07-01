import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Compass } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-24">
            <Helmet>
                <title>Page introuvable — Atelier Gesta</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="max-w-lg w-full text-center space-y-8">
                <div className="flex justify-center">
                    <Compass className="h-16 w-16 text-muted-foreground/50" strokeWidth={1} />
                </div>
                <div className="space-y-3">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Erreur 404</p>
                    <h1 className="font-editorial text-4xl md:text-5xl">Cette page n'existe pas.</h1>
                    <p className="font-sans text-muted-foreground leading-relaxed">
                        Le lien suivi est peut-être obsolète ou mal orthographié.
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
                        to="/contact"
                        className="font-mono text-xs uppercase tracking-widest py-3 px-8 border border-border hover:border-foreground transition-colors"
                    >
                        Nous contacter
                    </Link>
                </div>
            </div>
        </div>
    );
}
