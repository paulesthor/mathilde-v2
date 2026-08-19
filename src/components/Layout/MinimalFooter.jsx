import { Link } from 'react-router-dom';

export default function MinimalFooter() {
    return (
        <footer className="mt-auto border-t border-border bg-background py-10">
            <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-6 lg:grid-cols-3 lg:px-12">
                <div className="flex flex-col justify-between">
                    <h2 className="font-editorial text-3xl leading-tight">Gesta Studio</h2>
                    <p className="mt-2 font-mono text-sm text-muted-foreground">© {new Date().getFullYear()} Tous droits réservés.</p>
                </div>

                <div className="flex flex-col justify-between space-y-4">
                    <div className="flex flex-col space-y-2 font-mono text-sm uppercase tracking-widest">
                        <Link to="/realisations" className="hover:text-primary transition-colors">Réalisations</Link>
                        <Link to="/prestations" className="hover:text-primary transition-colors">Prestations</Link>
                        <Link to="/dispo" className="hover:text-primary transition-colors">Pièces disponibles</Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Link to="/legal?tab=mentions" className="hover:text-primary transition-colors">Mentions Légales</Link>
                        <span>•</span>
                        <Link to="/legal?tab=cgv" className="hover:text-primary transition-colors">CGV</Link>
                        <span>•</span>
                        <Link to="/legal?tab=security" className="hover:text-primary transition-colors">Sécurité & Paiement</Link>
                    </div>
                </div>

                <div className="flex flex-col space-y-2 font-mono text-sm text-muted-foreground text-right lg:items-end">
                    <p>123 Rue de l'Atelier, 75000 Paris</p>
                    <a href="mailto:contact@gesta-studio.com" className="text-foreground hover:text-primary transition-colors">contact@gesta-studio.com</a>
                    <a href="tel:+33600000000" className="text-foreground hover:text-primary transition-colors">06 00 00 00 00</a>
                </div>
            </div>
        </footer>
    );
}
