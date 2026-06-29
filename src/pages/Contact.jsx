import { Helmet } from 'react-helmet-async';

export default function Contact() {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = `De: ${formData.get('firstName')} ${formData.get('lastName')}\nTel: ${formData.get('phone')}\n\n${formData.get('message')}`;
        window.location.href = `mailto:contact@gesta-studio.com?subject=Demande de renseignement - ${formData.get('lastName')}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-[90vh] flex flex-col lg:flex-row">
            <Helmet>
                <title>Contact & Devis | Atelier Gesta</title>
                <meta name="description" content="Contactez l'Atelier Gesta pour un devis de rénovation, une question ou un rendez-vous à l'atelier à Paris." />
            </Helmet>

            {/* Editorial Title Side */}
            <div className="w-full lg:w-1/2 pt-32 pb-16 px-6 lg:px-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border">
                <div>
                    <h1 className="font-editorial text-7xl md:text-9xl tracking-tighter mix-blend-difference mb-12">
                        Parlons <br /><span className="text-primary italic">Projet.</span>
                    </h1>
                    <p className="font-sans text-xl md:text-2xl font-light text-muted-foreground max-w-md">
                        Pour une demande de devis, une question technique ou une prise de rendez-vous à l'atelier.
                    </p>
                </div>

                <div className="mt-24 space-y-8 font-mono text-sm tracking-widest uppercase">
                    <div>
                        <p className="text-muted-foreground mb-1">Email</p>
                        <a href="mailto:contact@gesta-studio.com" className="text-foreground hover:text-primary transition-colors">contact@gesta-studio.com</a>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Téléphone</p>
                        <a href="tel:+33600000000" className="text-foreground hover:text-primary transition-colors">06 00 00 00 00</a>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Visites</p>
                        <p className="text-foreground">Sur rendez-vous uniquement</p>
                    </div>
                </div>
            </div>

            {/* Form Side */}
            <div className="w-full lg:w-1/2 pt-16 pb-24 lg:py-32 px-6 lg:px-24 flex items-center justify-center">
                <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-12">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="relative group">
                            <input type="text" id="firstName" name="firstName" required className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors" placeholder=" " />
                            <label htmlFor="firstName" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                Prénom *
                            </label>
                        </div>
                        <div className="relative group">
                            <input type="text" id="lastName" name="lastName" required className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors" placeholder=" " />
                            <label htmlFor="lastName" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                Nom *
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="relative group">
                            <input type="email" id="email" name="email" required className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors" placeholder=" " />
                            <label htmlFor="email" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                Email *
                            </label>
                        </div>
                        <div className="relative group">
                            <input type="tel" id="phone" name="phone" className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors" placeholder=" " />
                            <label htmlFor="phone" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                Téléphone
                            </label>
                        </div>
                    </div>

                    <div className="relative group">
                        <textarea id="message" name="message" required rows="4" className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors resize-none" placeholder=" "></textarea>
                        <label htmlFor="message" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                            Votre projet *
                        </label>
                    </div>

                    <button type="submit" className="w-full py-6 font-mono text-sm tracking-widest uppercase bg-foreground text-background hover:bg-primary transition-colors duration-500">
                        Envoyer la demande
                    </button>

                </form>
            </div>

        </div>
    );
}
