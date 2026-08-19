import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Réalisations', path: '/realisations' },
    { name: 'Prestations', path: '/prestations' },
    { name: 'Créations', path: '/creations' },
    { name: 'Pièces dispo', path: '/dispo' },
    { name: 'À propos', path: '/about' },
    { name: 'Contact', path: '/contact' },
];

export default function FullScreenMenu({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex animate-in slide-in-from-top-full duration-500 ease-in-out">
            <div className="absolute inset-0 bg-background text-foreground">

                {/* Header inside Menu */}
                <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-end px-6 lg:px-12">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer le menu"
                        className="touch-manipulation group flex cursor-pointer items-center space-x-3 transition-opacity hover:text-primary"
                    >
                        <span className="hidden font-mono text-sm tracking-widest uppercase md:block">
                            Fermer
                        </span>
                        <X className="h-8 w-8 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-y-auto p-6 text-center lg:items-start lg:text-left lg:pl-32">
                    <nav className="flex flex-col space-y-3 py-4 md:space-y-5">
                        {navLinks.map((link, idx) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={onClose}
                                className="touch-manipulation group relative inline-block overflow-hidden"
                            >
                                <div className="flex items-baseline space-x-4">
                                    <span className="font-mono text-sm text-foreground/30 transition-colors group-hover:text-primary">
                                        0{idx + 1}
                                    </span>
                                    <span className="font-editorial text-4xl tracking-tighter transition-transform duration-500 group-hover:translate-x-4 group-hover:text-primary md:text-6xl lg:text-7xl">
                                        {link.name}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}
