import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Scale, FileText, Landmark } from 'lucide-react';

export default function Legal() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'mentions';

    const setTab = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    // Scroll to top on mount / tab change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentTab]);

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-full pt-32 pb-24 text-foreground">
            <Helmet>
                <title>Mentions Légales & CGV | Atelier Gesta</title>
                <meta name="description" content="Mentions légales, conditions générales de vente et politique de confidentialité de l'Atelier Gesta." />
            </Helmet>
            <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
                <header className="mb-16">
                    <h1 className="font-editorial text-5xl md:text-8xl tracking-tighter">
                        Informations <br /> <span className="italic text-primary">Légales.</span>
                    </h1>
                    <p className="mt-4 font-mono text-sm uppercase tracking-widest text-muted-foreground">
                        Mentions obligatoires, conditions de vente & sécurité des paiements
                    </p>
                </header>

                {/* Tabs Navigation */}
                <div className="flex border-b border-border/60 mb-12 overflow-x-auto scrollbar-none font-mono text-xs uppercase tracking-widest gap-8 md:gap-12 pb-4">
                    <button
                        onClick={() => setTab('mentions')}
                        className={`flex items-center gap-2 cursor-pointer transition-colors pb-2 -mb-[18px] border-b-2 ${
                            currentTab === 'mentions'
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Landmark className="h-4 w-4" />
                        Mentions Légales
                    </button>
                    <button
                        onClick={() => setTab('cgv')}
                        className={`flex items-center gap-2 cursor-pointer transition-colors pb-2 -mb-[18px] border-b-2 ${
                            currentTab === 'cgv'
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Scale className="h-4 w-4" />
                        Conditions Générales (CGV)
                    </button>
                    <button
                        onClick={() => setTab('security')}
                        className={`flex items-center gap-2 cursor-pointer transition-colors pb-2 -mb-[18px] border-b-2 ${
                            currentTab === 'security'
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Sécurité & Paiements
                    </button>
                </div>

                {/* Content Sections */}
                <div className="font-sans font-light text-foreground/80 text-base md:text-lg leading-relaxed max-w-[800px] space-y-12">
                    {currentTab === 'mentions' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">1. Éditeur du Site</h2>
                                <p>
                                    Le site <strong>Gesta Studio</strong> est édité par Mathilde Gesta, entrepreneur individuel.
                                    <br />
                                    <strong>Siège social :</strong> 123 Rue de l'Atelier, 75000 Paris
                                    <br />
                                    <strong>SIRET :</strong> 987 654 321 00012
                                    <br />
                                    <strong>Code APE :</strong> 9524Z (Réparation de meubles et d'équipements du foyer - Tapissière d'ameublement)
                                    <br />
                                    <strong>Directrice de la publication :</strong> Mathilde Gesta
                                    <br />
                                    <strong>Contact :</strong> <a href="mailto:contact@gesta-studio.com" className="underline hover:text-primary transition-colors">contact@gesta-studio.com</a> | 06 00 00 00 00
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">2. Hébergement</h2>
                                <p>
                                    Le frontend de ce site est hébergé par <strong>GitHub Pages</strong> :
                                    <br />
                                    GitHub, Inc. 88 Colin P Kelly Jr St, San Francisco, CA 94107, États-Unis.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">3. Base de données & Fonctions Serveur</h2>
                                <p>
                                    Le stockage des données et les fonctions d'automatisation Stripe sont hébergés par <strong>Supabase</strong> :
                                    <br />
                                    Supabase Inc., Co. Dublin, Irlande (hébergé sur des serveurs situés en Europe de l'Ouest - Région AWS Irlande).
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">4. Propriété Intellectuelle</h2>
                                <p>
                                    L'ensemble des contenus de ce site (textes, photographies des créations et meubles restaurés, monogramme, logo) sont la propriété exclusive de Gesta Studio ou de ses partenaires. Toute reproduction ou représentation, intégrale ou partielle, du site ou de l'un quelconque des éléments qui le composent est interdite sans autorisation préalable.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentTab === 'cgv' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">1. Objet des CGV</h2>
                                <p>
                                    Les présentes Conditions Générales de Vente (CGV) régissent toutes les ventes d'articles de mobilier restaurés, créations de l'atelier, et commandes de prestations de services de tapisserie effectuées en ligne via le site Gesta Studio.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">2. Produits, Quantités & Unicité</h2>
                                <p>
                                    Les meubles et accessoires proposés à la vente sur la page "Pièces disponibles" sont des <strong>pièces uniques de collection vintage</strong> restaurées artisanalement ou des créations originales de l'atelier.
                                    <br />
                                    La quantité disponible en stock est indiquée pour chaque article. La gestion du stock est synchronisée de façon automatique. Dès le paiement validé, la pièce est retirée des ventes disponibles pour éviter toute double commande.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">3. Tarifs et Conditions de Paiement</h2>
                                <p>
                                    Les prix indiqués sont en Euros (€) Toutes Taxes Comprises (TTC) (TVA non applicable, article 293 B du CGI). Les frais d'expédition ou de livraison ne sont pas inclus dans le prix de vente affiché et font l'objet d'une facturation ou d'un devis séparé le cas échéant.
                                    <br />
                                    Le paiement est exigible en totalité au moment de la commande.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">4. Retrait et Expédition</h2>
                                <p>
                                    Par défaut, les pièces achetées en ligne sont à retirer directement à l'atelier (123 Rue de l'Atelier, Paris) par l'acheteur ou son transporteur. 
                                    <br />
                                    Si vous souhaitez une livraison à domicile, veuillez nous contacter au préalable ou immédiatement après votre achat afin d'établir un devis personnalisé de transport.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">5. Droit de Rétractation</h2>
                                <p>
                                    <strong>Pour les produits prêts à la vente (Mobilier restauré disponible) :</strong> Vous disposez d'un délai de 14 jours calendaires à compter de la réception de la commande pour exercer votre droit de rétractation. Les frais de retour sont à votre charge exclusive et le produit doit être retourné dans son état de livraison initial.
                                    <br />
                                    <strong>Pour les commandes sur-mesure / Confections personnalisées :</strong> Conformément à l'article L.221-28 3° du Code de la consommation, le droit de rétractation ne peut pas être exercé pour les contrats de fourniture de biens confectionnés selon les spécifications du consommateur ou nettement personnalisés (ex: garniture ou rhabillage d'un de vos sièges personnels avec un tissu choisi sur-mesure).
                                </p>
                            </div>
                        </div>
                    )}

                    {currentTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">1. Sécurité des Paiements (Stripe)</h2>
                                <p>
                                    Les transactions financières effectuées sur notre catalogue en ligne sont sécurisées et opérées par notre partenaire <strong>Stripe</strong> (Stripe Payments Europe, Ltd. certifié conforme à la norme de sécurité de l'industrie des cartes de paiement PCI-DSS de niveau 1).
                                    <br />
                                    Lors du paiement d'une pièce disponible, le client saisit ses coordonnées bancaires directement sur une page web hautement sécurisée hébergée par Stripe (Checkout session).
                                    <br />
                                    <strong>Gesta Studio ne stocke pas, ne traite pas et ne voit jamais vos numéros de cartes de crédit ou identifiants bancaires.</strong>
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">2. Protection des Données (RGPD)</h2>
                                <p>
                                    Conformément au Règlement Général sur la Protection des Données (RGPD), les informations nominatives vous concernant (Nom, e-mail, adresse) sont uniquement utilisées pour :
                                    <br />
                                    - Le traitement de votre commande et l'établissement des factures.
                                    - La gestion de vos avis clients (soumis sur notre page d'accueil sous réserve de modération et approbation).
                                    <br />
                                    Ces données ne sont jamais vendues, louées ou transmises à des tiers à des fins publicitaires. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles sur simple demande par e-mail à <a href="mailto:contact@gesta-studio.com" className="underline hover:text-primary transition-colors">contact@gesta-studio.com</a>.
                                </p>
                            </div>

                            <div>
                                <h2 className="font-editorial text-3xl text-foreground mb-4">3. Sécurisation Technique du Site</h2>
                                <p>
                                    Pour préserver la sécurité de vos données, Gesta Studio utilise :
                                    <br />
                                    - Une connexion chiffrée SSL / HTTPS de bout en bout.
                                    - Une Content-Security-Policy (CSP) interdisant le chargement de scripts malveillants externes ou de widgets non sollicités.
                                    - Des autorisations et politiques de sécurité Row Level Security (RLS) sur nos tables et buckets Cloud pour interdire toute modification malveillante ou injection de données.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
