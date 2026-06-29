import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../utils/supabaseClient';

const INITIAL_FORM = { firstName: '', lastName: '', email: '', phone: '', message: '' };

export default function Contact() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMsg('');

        try {
            const { error } = await supabase.functions.invoke('send-contact-email', {
                body: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    message: form.message,
                },
            });

            if (error) throw new Error(error.message);

            setStatus('success');
            setForm(INITIAL_FORM);
        } catch (err) {
            console.error('Contact form error:', err);
            setErrorMsg('Une erreur est survenue. Merci de réessayer ou de nous contacter directement par email.');
            setStatus('error');
        }
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-[90vh] flex flex-col lg:flex-row">
            <Helmet>
                <title>Contact & Devis | Atelier Gesta</title>
                <meta name="description" content="Contactez l'Atelier Gesta pour un devis de rénovation, une question ou un rendez-vous à l'atelier à Paris." />
            </Helmet>

            {/* Côté gauche — Infos */}
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
                        <p className="text-muted-foreground mb-1">Visites</p>
                        <p className="text-foreground">Sur rendez-vous uniquement</p>
                    </div>
                </div>
            </div>

            {/* Côté droit — Formulaire */}
            <div className="w-full lg:w-1/2 pt-16 pb-24 lg:py-32 px-6 lg:px-24 flex items-center justify-center">

                {status === 'success' ? (
                    <div className="w-full max-w-xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-5xl">✓</div>
                        <h2 className="font-editorial text-4xl">Demande envoyée.</h2>
                        <p className="font-sans text-lg font-light text-muted-foreground">
                            Merci pour votre message ! Mathilde reviendra vers vous dans les 48h ouvrées.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="font-mono text-xs uppercase tracking-widest text-primary border-b border-primary/50 pb-1 hover:text-foreground hover:border-foreground transition-all duration-300"
                        >
                            Envoyer une autre demande
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-12">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="relative group">
                                <input
                                    type="text" id="firstName" name="firstName" required
                                    value={form.firstName} onChange={handleChange}
                                    className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors"
                                    placeholder=" "
                                />
                                <label htmlFor="firstName" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                    Prénom *
                                </label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="text" id="lastName" name="lastName" required
                                    value={form.lastName} onChange={handleChange}
                                    className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors"
                                    placeholder=" "
                                />
                                <label htmlFor="lastName" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                    Nom *
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="relative group">
                                <input
                                    type="email" id="email" name="email" required
                                    value={form.email} onChange={handleChange}
                                    className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors"
                                    placeholder=" "
                                />
                                <label htmlFor="email" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                    Email *
                                </label>
                            </div>
                            <div className="relative group">
                                <input
                                    type="tel" id="phone" name="phone"
                                    value={form.phone} onChange={handleChange}
                                    className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors"
                                    placeholder=" "
                                />
                                <label htmlFor="phone" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                    Téléphone
                                </label>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea
                                id="message" name="message" required rows="4"
                                value={form.message} onChange={handleChange}
                                className="w-full bg-transparent border-b border-border py-4 font-sans text-lg focus:outline-none focus:border-primary peer transition-colors resize-none"
                                placeholder=" "
                            />
                            <label htmlFor="message" className="absolute left-0 top-4 text-muted-foreground font-mono text-xs uppercase tracking-widest pointer-events-none transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-primary peer-valid:-top-4 peer-valid:text-[10px]">
                                Votre projet *
                            </label>
                        </div>

                        {status === 'error' && (
                            <p className="font-mono text-xs text-red-600 tracking-wide">
                                {errorMsg}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full py-6 font-mono text-sm tracking-widest uppercase bg-foreground text-background hover:bg-primary transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? 'Envoi en cours…' : 'Envoyer la demande'}
                        </button>

                    </form>
                )}
            </div>

        </div>
    );
}
