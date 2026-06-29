import { Helmet } from 'react-helmet-async';
import portraitMathilde from '../assets/portrait_mathilde.webp';

export default function About() {
    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen">
            <Helmet>
                <title>L'Atelier & Mathilde — À propos | Atelier Gesta</title>
                <meta name="description" content="Découvrez Mathilde et l'Atelier Gesta, atelier parisien de tapisserie d'ameublement. Passion, savoir-faire artisanal et créations sur-mesure." />
            </Helmet>

            {/* Intro Header */}
            <header className="pt-32 pb-16 md:pb-24 px-6 lg:px-12 mx-auto max-w-[1600px] flex justify-center text-center">
                <h1 className="font-editorial text-5xl md:text-8xl lg:text-[10rem] leading-[0.85] tracking-tighter">
                    L'Atelier <br /> <span className="italic text-primary">Gesta.</span>
                </h1>
            </header>

            {/* Asymmetric Image / Text Layout */}
            <section className="mx-auto max-w-[1600px] px-6 lg:px-12 pb-24">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-32 items-start">

                    <div className="w-full lg:w-1/2 lg:sticky lg:top-32">
                        <div className="relative aspect-[3/4] w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000">
                            <img
                                src={portraitMathilde}
                                alt="Mathilde, Artisane Tapissière"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex flex-col">
                        <h2 className="font-mono text-sm tracking-widest text-primary uppercase mb-8">
                            L'Artisane & Son Parcours
                        </h2>
                        <div className="font-sans font-light text-lg md:text-xl leading-relaxed text-foreground space-y-8">
                            <p>
                                Mon parcours professionnel est atypique et s’est construit de mes centres d’intérêt et de mes envies d’exploration, tant intellectuelles que géographiques. J’ai étudié l’histoire de l’art à l’École du Louvre (spécialisations dans le décor et l’ameublement des grandes demeures, puis dans l’art du XXe siècle) et le droit de l’environnement.
                            </p>
                            <p className="text-muted-foreground">
                                J’ai exercé le métier de juriste pendant quatre ans. Malgré l’intérêt intellectuel, je ressentais un profond décalage avec mon quotidien professionnel. Une sensation persistante de ne pas être à ma place, voire de jouer un rôle.
                            </p>
                            <p>
                                Fin 2023, je décide de changer de cap. Il me mène vers la création, les couleurs, les objets, l’esthétique et le travail manuel. L’évidence s’impose : la tapisserie d’ameublement. Et la suite se fait assez naturellement, je rencontre une tapissière expérimentée chez qui je passe deux semaines en immersion. Dès les premières heures, je sais que j’ai trouvé ma voie.
                            </p>
                            <p className="text-muted-foreground">
                                Je décide de m’inscrire au CAP Tapissier en siège au lycée de Neufchâteau pour y apprendre la tapisserie traditionnelle (garniture en crin), les méthodes de la tapisserie moderne (garniture en mousse), ainsi que la couture d’ameublement. Je poursuis ma formation avec un Certificat de Qualification Professionnelle en couture d’ameublement au sein de l’AFPIA Est-Nord.
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* 3 Axes of Expertise */}
            <section className="border-t border-border/60 py-20 bg-muted/10">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                    <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-12">
                        Axes d'expertise
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col border-l border-primary/30 pl-6 py-4">
                            <span className="font-mono text-xs text-primary mb-2">01 / RESTAURATION</span>
                            <h3 className="font-editorial text-2xl md:text-3xl">La rénovation de sièges modernes</h3>
                        </div>
                        <div className="flex flex-col border-l border-primary/30 pl-6 py-4">
                            <span className="font-mono text-xs text-primary mb-2">02 / PIÈCES UNIQUES</span>
                            <h3 className="font-editorial text-2xl md:text-3xl">La création de pièces contemporaines</h3>
                        </div>
                        <div className="flex flex-col border-l border-primary/30 pl-6 py-4">
                            <span className="font-mono text-xs text-primary mb-2">03 / CONFECTION</span>
                            <h3 className="font-editorial text-2xl md:text-3xl">La confection de rideaux adaptés aux intérieurs</h3>
                        </div>
                    </div>
                    
                    <div className="mt-16 max-w-3xl">
                        <p className="font-editorial text-3xl md:text-4xl text-foreground leading-snug">
                            C’est dans cette direction que je souhaite développer mon activité, en alliant savoir-faire artisanal, sensibilité esthétique et approche contemporaine du mobilier.
                        </p>
                        <p className="font-mono text-sm tracking-widest text-primary mt-6">
                            Chaque pièce est unique et traitée comme une œuvre d'art.
                        </p>
                    </div>
                </div>
            </section>

            {/* Démarche de Création Section */}
            <section className="border-t border-border/60 py-24 md:py-32 bg-card text-foreground">
                <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
                    <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
                        <div className="w-full lg:w-1/3">
                            <h2 className="font-mono text-sm tracking-widest text-primary uppercase mb-4">
                                Philosophie
                            </h2>
                            <h3 className="font-editorial text-4xl md:text-6xl leading-tight">
                                Démarche de création.
                            </h3>
                        </div>
                        
                        <div className="w-full lg:w-2/3 space-y-8 font-sans font-light text-lg md:text-xl leading-relaxed">
                            <p>
                                Ma démarche de création combine la tapisserie, la couture et l'inspiration des arts plastiques du XXème siècle (peinture et sculpture majoritairement), mêlant formes épurées et géométriques à des couleurs franches et tranchées. La première réponse proposée est celle de la colonne de tabourets, dont un prototype a été réalisé en juin 2025 et une version finale au printemps 2026.
                            </p>
                            <p className="text-muted-foreground">
                                Ce qui me touche particulièrement dans l’art du XXème siècle, ce sont les formes géométriques et épurées que l’on retrouve chez de nombreux peintres et sculpteurs, ainsi que les couleurs franches et vibrantes des mouvements tels que le Fauvisme, le Bauhaus ou encore le Blaue Reiter. Ces éléments esthétiques sont pour moi une source constante d’inspiration.
                            </p>
                            <p>
                                Ces artistes ont choisi de s’éloigner de la représentation réaliste pour se concentrer sur l’émotion. En travaillant des motifs simplifiés et des couleurs parfois en rupture avec le réel, ils ont ouvert la voie à une expression plus instinctive, plus sensorielle. C’est cette capacité à faire ressentir, à toucher sans dire, que je cherche à retrouver dans mon propre travail : créer des objets qui, par leur forme et leur couleur, éveillent une émotion, procurent de la joie ou suscitent l’étonnement.
                            </p>
                            <p className="text-muted-foreground">
                                Aujourd’hui, dans une époque où les couleurs neutres dominent – par crainte du mauvais goût ou par souci de conformité –, je ressens le besoin de réintroduire de la couleur. Pour moi, la couleur est un moyen d’exprimer sa personnalité et de revendiquer une identité visuelle forte.
                            </p>
                            <p>
                                L’usage de formes géométriques répond également à une volonté de simplicité, en écho à l’art moderne, mais il a aussi une fonction pratique dans le travail de la tapisserie. Ma colonne de tabourets en est un exemple significatif. Inspirée par les lignes épurées de la <em>Colonne sans fin</em> de Brancusi, elle en reprend la verticalité et la modularité, tout en s’en démarquant par l’usage de couleurs franches, rompant ainsi avec la monochromie de la sculpture originale.
                            </p>
                            <p className="border-l-2 border-primary pl-6 py-2 italic font-editorial text-2xl md:text-3xl text-foreground">
                                À travers cette approche, je cherche à créer des pièces qui conjuguent fonctionnalité, puissance plastique et charge émotionnelle, en puisant dans l’héritage artistique du siècle dernier pour proposer une lecture contemporaine, audacieuse et personnelle du mobilier.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
