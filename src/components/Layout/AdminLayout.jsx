import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Star, MessageSquare, LogOut, Bell, BellOff } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAdminCounts } from '../../hooks/useAdminCounts';

const VAPID_PUBLIC_KEY = 'BB3NKxbXKZYftqM_oCd0F7Zh2JYKkjOIq0NxKLNAFMkamT_oxv0zGnmKiVKx-j6dUL7b-GBXlzr7h6kzY562peY';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function usePushSubscription() {
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }
        if (Notification.permission === 'denied') { setStatus('denied'); return; }
        navigator.serviceWorker.ready.then((reg) =>
            reg.pushManager.getSubscription()
        ).then((sub) => setStatus(sub ? 'subscribed' : 'idle'));
    }, []);

    const subscribe = async () => {
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            const endpoint = sub.endpoint;
            const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))));
            const auth   = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))));
            const { error } = await supabase.from('push_subscriptions').upsert(
                [{ endpoint, p256dh, auth }],
                { onConflict: 'endpoint', ignoreDuplicates: true }
            );
            if (error) throw error;
            setStatus('subscribed');
        } catch (err) {
            console.error('[Push] subscribe error:', err);
            setStatus(Notification.permission === 'denied' ? 'denied' : 'idle');
        }
    };

    const unsubscribe = async () => {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            await sub.unsubscribe();
        }
        setStatus('idle');
    };

    return { status, subscribe, unsubscribe };
}

function Badge({ count }) {
    if (!count) return null;
    return (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold font-mono flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
        </span>
    );
}

const TABS = [
    { id: 'products', label: 'Catalogue', icon: Package,       path: '/admin/products', countKey: null },
    { id: 'orders',   label: 'Commandes', icon: ShoppingBag,   path: '/admin/orders',   countKey: 'orders' },
    { id: 'reviews',  label: 'Avis',      icon: Star,          path: '/admin/reviews',  countKey: 'reviews' },
    { id: 'contacts', label: 'Demandes',  icon: MessageSquare, path: '/admin/contacts', countKey: 'contacts' },
];

export default function AdminLayout({ children, activeTab, title }) {
    const navigate = useNavigate();
    const counts = useAdminCounts();
    const { status: pushStatus, subscribe, unsubscribe } = usePushSubscription();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const handlePushToggle = () => {
        if (pushStatus === 'subscribed') unsubscribe();
        else subscribe();
    };

    const pushLabel = {
        idle: 'Activer les notifications',
        subscribed: 'Notifications activées',
        denied: 'Notifications bloquées',
        unsupported: 'Non supporté',
    }[pushStatus] ?? '';

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Top header — safe area gérée avec padding séparé du contenu */}
            <header
                className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b border-border"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="h-14 flex items-center justify-between px-5 lg:px-8">
                    <span className="font-mono text-[11px] uppercase tracking-[0.25em] font-bold text-primary flex-shrink-0">Gesta</span>
                    <span className="font-sans text-sm font-medium truncate mx-4 text-center">{title}</span>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {pushStatus !== 'unsupported' && (
                            <button
                                onClick={handlePushToggle}
                                disabled={pushStatus === 'denied'}
                                aria-label={pushLabel}
                                title={pushLabel}
                                className={`flex items-center transition-colors ${
                                    pushStatus === 'subscribed'
                                        ? 'text-emerald-500 hover:text-rose-500'
                                        : pushStatus === 'denied'
                                        ? 'text-muted-foreground/40 cursor-not-allowed'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {pushStatus === 'subscribed'
                                    ? <Bell size={18} strokeWidth={1.5} />
                                    : <BellOff size={18} strokeWidth={1.5} />
                                }
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            aria-label="Se déconnecter"
                            className="flex items-center text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                            <LogOut size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenu — padding-top = safe-area + hauteur header 56px + espace */}
            <main
                className="pb-28 px-4 lg:px-8 max-w-6xl mx-auto"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}
            >
                {children}
            </main>

            {/* Bottom tab bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border grid grid-cols-4"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {TABS.map(({ id, label, icon: Icon, path, countKey }) => {
                    const isActive = activeTab === id;
                    const count = countKey ? counts[countKey] : 0;
                    return (
                        <Link
                            key={id}
                            to={path}
                            className={`flex flex-col items-center justify-center gap-1 py-3 relative transition-colors ${
                                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-foreground rounded-b-full" />
                            )}
                            <span className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                                <Badge count={count} />
                            </span>
                            <span className={`font-mono text-[9px] uppercase tracking-wider leading-none ${isActive ? 'font-bold' : ''}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
