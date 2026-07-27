import { Plus, Trash } from 'lucide-react';
import { useEditMode } from '../../contexts/EditModeContext';

// Bouton de suppression flottant sur un item de liste, visible seulement en
// mode édition (au survol). À placer dans un conteneur `relative group`.
export function DeleteItemButton({ onDelete, label = 'Supprimer' }) {
    const { isAdmin, isEditMode } = useEditMode();
    if (!isAdmin || !isEditMode) return null;

    return (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm('Supprimer cet élément ?')) onDelete(); }}
            title={label}
            aria-label={label}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-opacity shadow-lg"
        >
            <Trash className="h-4 w-4" />
        </button>
    );
}

// Tuile "Ajouter un élément" en fin de liste, visible seulement en mode édition.
export function AddItemTile({ onAdd, label = 'Ajouter un élément', className = '' }) {
    const { isAdmin, isEditMode } = useEditMode();
    if (!isAdmin || !isEditMode) return null;

    return (
        <button
            onClick={onAdd}
            className={`flex items-center justify-center gap-2 border border-dashed border-primary/50 text-primary font-mono text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors rounded-lg py-8 ${className}`}
        >
            <Plus className="h-4 w-4" /> {label}
        </button>
    );
}
