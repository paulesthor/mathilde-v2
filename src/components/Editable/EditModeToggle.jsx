import { Pencil, X, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEditMode } from '../../contexts/EditModeContext';

// Bouton flottant visible uniquement pour un admin connecté (sur les pages
// publiques). Active/désactive le mode édition inline (double-clic sur
// texte/photo). Invisible pour tout visiteur non authentifié.
//
// Regroupé en bas à droite (et non en bandeau plein largeur en haut) pour
// ne jamais chevaucher le logo/menu de la navbar publique, qui reste fixe
// en haut de toutes les pages.
export default function EditModeToggle() {
    const { isAdmin, isEditMode, setIsEditMode } = useEditMode();

    if (!isAdmin) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
            {isEditMode && (
                <>
                    <div className="max-w-[220px] bg-primary text-white text-right font-mono text-[9px] uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg leading-relaxed">
                        Double-cliquez sur un texte ou une photo pour le modifier
                    </div>
                    <Link
                        to="/admin/products"
                        onClick={() => setIsEditMode(false)}
                        className="touch-manipulation flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-mono text-[10px] uppercase tracking-widest bg-foreground text-background hover:bg-primary transition-colors"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Retour à l'admin
                    </Link>
                </>
            )}
            <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`touch-manipulation flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    isEditMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-foreground text-background hover:bg-primary'
                }`}
            >
                {isEditMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {isEditMode ? 'Quitter le mode édition' : 'Modifier le site'}
            </button>
        </div>
    );
}
