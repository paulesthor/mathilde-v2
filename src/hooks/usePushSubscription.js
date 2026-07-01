import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const VAPID_PUBLIC_KEY = 'BB3NKxbXKZYftqM_oCd0F7Zh2JYKkjOIq0NxKLNAFMkamT_oxv0zGnmKiVKx-j6dUL7b-GBXlzr7h6kzY562peY';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
    const [status, setStatus] = useState('idle');
    const [endpoint, setEndpoint] = useState(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }
        if (Notification.permission === 'denied') { setStatus('denied'); return; }
        navigator.serviceWorker.ready.then((reg) =>
            reg.pushManager.getSubscription()
        ).then((sub) => {
            setStatus(sub ? 'subscribed' : 'idle');
            setEndpoint(sub ? sub.endpoint : null);
        });
    }, []);

    const subscribe = async () => {
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            const subEndpoint = sub.endpoint;
            const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))));
            const auth   = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))));
            const { error } = await supabase.from('push_subscriptions').upsert(
                [{ endpoint: subEndpoint, p256dh, auth }],
                { onConflict: 'endpoint', ignoreDuplicates: true }
            );
            if (error) throw error;
            setStatus('subscribed');
            setEndpoint(subEndpoint);
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
        setEndpoint(null);
    };

    return { status, endpoint, subscribe, unsubscribe };
}
