import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useEditMode } from '../../contexts/EditModeContext';
import { useToast } from '../../contexts/ToastContext';
import { prepareImageFile } from '../../lib/imageUpload';

// Primitive d'édition inline contrôlée pour les images : double-clic ouvre
// le sélecteur de fichier, compresse la photo puis délègue l'upload/la
// sauvegarde au parent via onUpload(file). N'importe aucune logique Supabase.
export default function InlineEditableImage({ src, alt = '', onUpload, className = '', imgClassName = '' }) {
    const { isAdmin, isEditMode } = useEditMode();
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleDoubleClick = (e) => {
        if (!isAdmin || !isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const { file: prepared } = await prepareImageFile(file);
            await onUpload(prepared);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`relative ${isAdmin && isEditMode ? 'group/editable' : ''} ${className}`} onDoubleClick={handleDoubleClick}>
            <img src={src} alt={alt} className={imgClassName} loading="lazy" />
            {isAdmin && isEditMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/editable:bg-black/40 transition-colors cursor-pointer">
                    <span className="opacity-0 group-hover/editable:opacity-100 transition-opacity bg-white text-black rounded-full p-3">
                        <Camera className="h-5 w-5" />
                    </span>
                </div>
            )}
            {isAdmin && (
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            )}
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-mono text-[10px] uppercase tracking-widest">
                    Envoi...
                </div>
            )}
        </div>
    );
}
