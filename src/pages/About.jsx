export default function About() {
    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen">

            {/* Intro Header */}
            <header className="pt-32 pb-16 md:pb-32 px-6 lg:px-12 mx-auto max-w-[1600px] flex justify-center text-center">
                <h1 className="font-editorial text-5xl md:text-8xl lg:text-[10rem] leading-[0.85] tracking-tighter">
                    L'Atelier <br /> <span className="italic text-primary">Gesta.</span>
                </h1>
            </header>

            {/* Asymmetric Image / Text Layout */}
            <section className="mx-auto max-w-[1600px] px-6 lg:px-12 pb-32">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-32 items-center">

                    <div className="w-full lg:w-1/2">
                        <div className="relative aspect-[3/4] w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000">
                            <img
                                src="https://images.unsplash.com/photo-1544474323-2895f4bc16b7?auto=format&fit=crop&q=80&w=1200"
                                alt="Portrait Mathilde"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col justify-center">
                        <h2 className="font-mono text-sm tracking-widest text-primary uppercase mb-8">
                            L'Artisane
                        </h2>
                        <div className="font-sans font-light text-xl md:text-3xl leading-relaxed text-foreground space-y-12">
                            <p>
                                Passionnée par le mobilier ancien et fascinée par les textures, j'ai fondé Gesta Studio avec une volonté forte : sauvegarder le patrimoine mobilier tout en l'inscrivant dans notre époque.
                            </p>
                            <p className="text-muted-foreground">
                                Je travaille selon les techniques traditionnelles (crin végétal, ressorts, piqûres à la main) ou contemporaines (mousse Haute Résilience), en sélectionnant avec le plus grand soin les étoffes auprès d'éditeurs prestigieux ou de créateurs indépendants.
                            </p>
                            <p className="font-editorial text-4xl md:text-5xl text-foreground">
                                Chaque siège restauré est une pièce unique, traitée comme une <span className="italic">œuvre d'art.</span>
                            </p>
                        </div>
                    </div>

                </div>
            </section>

        </div>
    );
}
