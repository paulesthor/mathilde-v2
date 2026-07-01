import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = { success: CheckCircle, error: AlertCircle, info: Info };
const STYLES = {
    success: 'border-emerald-500/30 text-emerald-600',
    error: 'border-rose-500/30 text-rose-600',
    info: 'border-border text-foreground',
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info') => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[200] flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none">
                {toasts.map((t) => {
                    const Icon = ICONS[t.type] ?? Info;
                    return (
                        <div
                            key={t.id}
                            role="status"
                            className={`pointer-events-auto font-sans text-sm rounded-lg border shadow-lg px-4 py-3 bg-background backdrop-blur flex items-start gap-3 ${STYLES[t.type] ?? STYLES.info}`}
                        >
                            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="flex-1 text-foreground/90">{t.message}</span>
                            <button
                                onClick={() => dismissToast(t.id)}
                                aria-label="Fermer la notification"
                                className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast doit être utilisé à l\'intérieur de ToastProvider');
    return ctx;
}
