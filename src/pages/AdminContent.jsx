import { useState } from 'react';
import { FileText } from 'lucide-react';
import AdminLayout from '../components/Layout/AdminLayout';
import ContentSingletonField from '../components/Admin/ContentSingletonField';
import ContentListEditor from '../components/Admin/ContentListEditor';

const PAGES = [
    {
        id: 'home',
        label: 'Accueil',
        fields: [
            { section: 'hero_eyebrow', label: "Texte au-dessus du titre", type: 'text', fallback: "Atelier de Tapisserie d'Ameublement" },
            { section: 'hero_title', label: 'Titre principal', type: 'textarea', fallback: 'Adopter une décoration qui vous ressemble et faites revenir la couleur dans votre intérieur.' },
            { section: 'portrait_image', label: 'Photo portrait', type: 'image' },
            { section: 'portrait_name', label: 'Nom sous le portrait', type: 'text', fallback: 'Mathilde' },
            { section: 'portrait_role', label: 'Rôle sous le portrait', type: 'text', fallback: 'Artisane Tapissière · Atelier Gesta' },
            { section: 'editorial_citation', label: 'Citation éditoriale', type: 'textarea', fallback: 'Allier savoir-faire artisanal, sensibilité esthétique et approche contemporaine du mobilier.' },
        ],
        list: { section: 'hero_carousel', label: 'Carrousel photo (page accueil)', titleLabel: 'Légende de la photo', hasImage: true, hasDescription: false, hasDetails: false },
    },
    {
        id: 'about',
        label: 'À propos',
        fields: [
            { section: 'portrait_image', label: 'Photo portrait', type: 'image' },
            { section: 'bio_text', label: 'Parcours (séparez les paragraphes par une ligne vide)', type: 'textarea' },
            { section: 'philosophy_text', label: 'Démarche de création (séparez les paragraphes par une ligne vide)', type: 'textarea' },
        ],
    },
    {
        id: 'realisations',
        label: 'Réalisations',
        list: { section: 'item', label: 'Réalisations', titleLabel: 'Titre de la pièce', hasImage: true, hasDescription: true, hasDetails: true },
    },
    {
        id: 'creations',
        label: 'Créations',
        list: { section: 'item', label: 'Créations', titleLabel: 'Titre de la création', hasImage: true, hasDescription: true, hasDetails: true },
    },
    {
        id: 'prestations',
        label: 'Prestations',
        list: { section: 'item', label: 'Prestations', titleLabel: 'Titre de la prestation', hasImage: false, hasDescription: true, hasDetails: true },
    },
    {
        id: 'contact',
        label: 'Contact',
        fields: [
            { section: 'hero_title', label: 'Titre', type: 'text', fallback: 'Parlons Projet.' },
            { section: 'hero_subtitle', label: 'Sous-titre', type: 'textarea', fallback: "Pour une demande de devis, une question technique ou une prise de rendez-vous à l'atelier." },
            { section: 'contact_email', label: 'Email affiché', type: 'text', fallback: 'contact@gesta-studio.com', help: "N'affecte que l'affichage sur le site. Pour changer l'adresse qui reçoit réellement les demandes, modifier la variable CONTACT_NOTIFY_EMAIL dans les secrets Supabase." },
            { section: 'visits_text', label: 'Texte "Visites"', type: 'text', fallback: 'Sur rendez-vous uniquement' },
        ],
    },
];

export default function AdminContent() {
    const [activePage, setActivePage] = useState('home');
    const page = PAGES.find((p) => p.id === activePage);

    return (
        <AdminLayout activeTab="content" title="Contenu du site">
            <header className="mb-12 border-b border-border/40 pb-8">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Contenu éditorial
                </span>
                <h1 className="font-editorial text-4xl md:text-6xl mt-4">
                    Textes & photos du site.
                </h1>
                <p className="font-sans text-muted-foreground mt-4 max-w-2xl">
                    Modifiez ici les textes et photos des pages publiques. Les changements sont sauvegardés automatiquement dès que vous quittez un champ. La page « Pièces disponibles » se gère depuis l'onglet Catalogue.
                </p>
            </header>

            <div className="flex flex-wrap gap-2 mb-12">
                {PAGES.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setActivePage(p.id)}
                        className={`px-4 py-2 font-mono text-xs uppercase tracking-widest border rounded-full transition-colors ${
                            activePage === p.id
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {page?.fields && (
                <div className="space-y-8 max-w-2xl mb-16">
                    {page.fields.map((field) => (
                        <ContentSingletonField key={field.section} page={page.id} {...field} />
                    ))}
                </div>
            )}

            {page?.list && (
                <div className="max-w-3xl">
                    <h2 className="font-editorial text-2xl mb-6">{page.list.label}</h2>
                    <ContentListEditor page={page.id} {...page.list} />
                </div>
            )}
        </AdminLayout>
    );
}
