import { useRef, useState, useEffect } from 'react';
import { useEditMode } from '../../contexts/EditModeContext';

// Primitive d'édition inline contrôlée : double-clic pour éditer directement
// dans l'élément (contentEditable natif, préserve la typographie exacte),
// clic ailleurs pour enregistrer, Échap pour annuler.
// N'importe aucune logique de sauvegarde : le parent fournit value/onCommit.
export default function InlineEditable({ value, onCommit, as: Tag = 'span', className = '', multiline = true }) {
    const { isAdmin, isEditMode } = useEditMode();
    const ref = useRef(null);
    const [editing, setEditing] = useState(false);
    const beforeEditRef = useRef('');

    useEffect(() => {
        if (ref.current && !editing) ref.current.textContent = value;
    }, [value, editing]);

    const startEditing = (e) => {
        if (!isAdmin || !isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        beforeEditRef.current = ref.current.textContent;
        setEditing(true);
        ref.current.setAttribute('contenteditable', 'true');
        ref.current.focus();
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };

    const finishEditing = (save) => {
        if (!editing) return;
        ref.current.removeAttribute('contenteditable');
        setEditing(false);
        if (!save) {
            ref.current.textContent = beforeEditRef.current;
            return;
        }
        const newValue = ref.current.textContent.trim();
        if (newValue !== beforeEditRef.current.trim()) {
            onCommit(newValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            finishEditing(false);
            ref.current.blur();
        } else if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            ref.current.blur();
        }
    };

    const editModeClass = isAdmin && isEditMode
        ? `outline-dashed outline-1 outline-offset-2 ${editing ? 'outline-primary bg-primary/5' : 'outline-primary/0 hover:outline-primary/50'} cursor-text transition-all rounded-sm`
        : '';

    return (
        <Tag
            ref={ref}
            className={`${className} ${editModeClass}`.trim()}
            onDoubleClick={startEditing}
            onBlur={() => finishEditing(true)}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
        />
    );
}
