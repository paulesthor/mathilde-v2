import { Pencil, X } from 'lucide-react';
import { useEditMode } from '../../contexts/EditModeContext';

// Bouton flottant visible uniquement pour un admin connecté (sur les pages
// publiques). Active/désactive le mode édition inline (double-clic sur
// texte/photo). Invisible pour tout visiteur non authentifié.
export default function EditModeToggle() {
    const { isAdmin, isEditMode, setIsEditMode } = useEditMode();

    if (!isAdmin) return null;

    return (
        <>
            {isEditMode && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-white text-center py-2 font-mono text-[10px] uppercase tracking-widest px-4">
                    Mode édition activé — double-cliquez sur un texte ou une photo pour le modifier
                </div>
            )}
            <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    isEditMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-foreground text-background hover:bg-primary'
                }`}
            >
                {isEditMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {isEditMode ? 'Quitter le mode édition' : 'Modifier le site'}
            </button>
        </>
    );
}
