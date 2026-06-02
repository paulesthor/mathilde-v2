import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ProtectedRoute({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const envUrl = import.meta.env.VITE_SUPABASE_URL;
        const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!envUrl || !envKey) {
            // Simulation Mode: check localStorage
            const loggedIn = localStorage.getItem('gesta_admin_logged_in') === 'true';
            setSession(loggedIn ? { user: { email: 'admin@gesta.fr' } } : null);
            setLoading(false);
        } else {
            // Live Mode: check Supabase session
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setLoading(false);
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        }
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-mono text-xs uppercase tracking-[0.2em]">
                Vérification des accès...
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}
