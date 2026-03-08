export default function MinimalFooter() {
    return (
        <footer className="mt-auto border-t border-border bg-background py-16">
            <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-6 lg:grid-cols-3 lg:px-12">
                <div className="flex flex-col justify-between">
                    <h2 className="font-editorial text-4xl leading-tight">Gesta Studio</h2>
                    <p className="mt-4 font-mono text-sm text-muted-foreground">© {new Date().getFullYear()} Tous droits réservés.</p>
                </div>

                <div className="flex flex-col space-y-4 font-mono text-sm uppercase tracking-widest">
                    <a href="/realisations" className="hover:text-primary transition-colors">Réalisations</a>
                    <a href="/prestations" className="hover:text-primary transition-colors">Prestations</a>
                    <a href="/dispo" className="hover:text-primary transition-colors">Pièces disponibles</a>
                </div>

                <div className="flex flex-col space-y-4 font-mono text-sm text-muted-foreground text-right lg:items-end">
                    <p>123 Rue de l'Atelier, 75000 Paris</p>
                    <a href="mailto:contact@gesta-studio.com" className="text-foreground hover:text-primary transition-colors">contact@gesta-studio.com</a>
                    <a href="tel:+33600000000" className="text-foreground hover:text-primary transition-colors">06 00 00 00 00</a>
                </div>
            </div>
        </footer>
    );
}
