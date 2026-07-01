import { useState, useEffect } from 'react';
import { ShoppingBag, MessageSquare, Star, Bell, BellOff } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { useToast } from '../contexts/ToastContext';
import AdminLayout from '../components/Layout/AdminLayout';

const NOTIF_TYPES = [
    { key: 'notify_orders',   label: 'Nouvelles commandes',   description: 'Un client vient de payer une pièce.', icon: ShoppingBag },
    { key: 'notify_contacts', label: 'Demandes de devis',     description: 'Un visiteur a rempli le formulaire de contact.', icon: MessageSquare },
    { key: 'notify_reviews',  label: 'Nouveaux avis',         description: 'Un avis a été déposé et attend une modération.', icon: Star },
];

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-border'}`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
        </button>
    );
}

export default function AdminSettings() {
    const { showToast } = useToast();
    const { status: pushStatus, endpoint, subscribe } = usePushSubscription();
    const [prefs, setPrefs] = useState({ notify_orders: true, notify_contacts: true, notify_reviews: true });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const loadPrefs = async () => {
            if (!endpoint) {
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('notify_orders, notify_contacts, notify_reviews')
                .eq('endpoint', endpoint)
                .single();
            if (cancelled) return;
            if (!error && data) setPrefs(data);
            setLoading(false);
        };
        loadPrefs();
        return () => { cancelled = true; };
    }, [endpoint]);

    const togglePref = async (key) => {
        const nextValue = !prefs[key];
        setPrefs((prev) => ({ ...prev, [key]: nextValue }));
        if (endpoint) {
            const { error } = await supabase
                .from('push_subscriptions')
                .update({ [key]: nextValue })
                .eq('endpoint', endpoint);
            if (error) {
                // rollback en cas d'échec d'écriture
                setPrefs((prev) => ({ ...prev, [key]: !nextValue }));
                showToast("Erreur lors de la mise à jour : " + error.message, 'error');
            }
        }
    };

    return (
        <AdminLayout activeTab="settings" title="Réglages">
            <header className="mb-16 border-b border-border/40 pb-8">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                    Espace Réglages
                </span>
                <h1 className="font-editorial text-5xl md:text-7xl mt-4">
                    Notifications.
                </h1>
            </header>

            {pushStatus !== 'subscribed' ? (
                <div className="border border-dashed border-border py-16 px-8 text-center rounded-lg max-w-xl">
                    <BellOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="font-sans font-light text-muted-foreground mb-6">
                        {pushStatus === 'denied'
                            ? "Les notifications sont bloquées pour ce site dans les réglages de votre navigateur/téléphone."
                            : "Activez d'abord les notifications pour choisir celles que vous souhaitez recevoir."}
                    </p>
                    {pushStatus !== 'denied' && (
                        <button
                            onClick={subscribe}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest px-6 py-3 transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            Activer les notifications
                        </button>
                    )}
                </div>
            ) : loading ? (
                <p className="font-mono text-sm tracking-widest py-12">Chargement...</p>
            ) : (
                <div className="max-w-xl space-y-4">
                    {NOTIF_TYPES.map(({ key, label, description, icon: Icon }) => (
                        <div
                            key={key}
                            className="border border-border/80 bg-muted/10 p-6 rounded-lg flex items-center justify-between gap-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-sans font-medium text-sm">{label}</p>
                                    <p className="font-sans font-light text-xs text-muted-foreground mt-1">{description}</p>
                                </div>
                            </div>
                            <Toggle checked={!!prefs[key]} onChange={() => togglePref(key)} />
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
