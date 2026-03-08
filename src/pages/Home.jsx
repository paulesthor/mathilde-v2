import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="animate-in fade-in duration-1000">

            {/* Massive Hero Section */}
            <section className="relative min-h-[90vh] w-full pt-24 overflow-hidden bg-background">
                {/* Full Bleed Image with Overlay */}
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80"
                        alt="Atelier Gesta"
                        className="h-full w-full object-cover object-center scale-105 transform hover:scale-100 transition-transform duration-[2000ms]"
                    />
                    <div className="absolute inset-0 bg-black/20" /> {/* Subtle darkening for text readability */}
                </div>

                {/* Minimalist Text Overlay */}
                <div className="relative z-10 mx-auto max-w-[1600px] h-[calc(90vh-6rem)] flex items-end pb-24 px-6 lg:px-12 pointer-events-none">
                    <div className="max-w-3xl text-white pointer-events-auto">
                        <h1 className="font-editorial text-7xl font-bold tracking-tighter sm:text-8xl lg:text-[10rem] leading-[0.8] drop-shadow-md">
                            Gesta <br />
                            <span className="italic">Studio.</span>
                        </h1>
                        <p className="mt-8 font-mono text-sm uppercase tracking-[0.2em] max-w-sm drop-shadow-sm opacity-90">
                            Artisan Tapissier & Création Textile sur Mesure
                        </p>
                    </div>
                </div>
            </section>

            {/* Editorial Scrolling Section */}
            <section className="bg-background py-32 md:py-48">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12 flex flex-col items-center justify-center text-center">
                    <h2 className="font-editorial text-4xl md:text-7xl leading-tight max-w-5xl">
                        Redonner vie aux classiques avec audace et minutie.
                    </h2>
                    <div className="mt-16">
                        <Link to="/about" className="font-mono text-sm tracking-widest uppercase border-b border-foreground pb-2 hover:text-primary hover:border-primary transition-colors">
                            Découvrir l'Atelier
                        </Link>
                    </div>
                </div>
            </section>

            {/* Full Width Marquee/Banner Idea */}
            <section className="bg-primary text-primary-foreground py-24 overflow-hidden">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-12">
                    <h2 className="font-editorial text-5xl md:text-7xl w-full md:w-2/3 leading-none">
                        Vous avez un projet de restauration ?
                    </h2>
                    <Link to="/contact" className="font-mono text-sm tracking-widest uppercase border border-white/30 px-8 py-4 bg-white/0 hover:bg-white hover:text-primary transition-all">
                        Discutons-en
                    </Link>
                </div>
            </section>

        </div>
    );
}
