import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK === 'true' && !import.meta.env.PROD;

export default function ProtectedRoute({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (MOCK_ENABLED) {
            // Simulation Mode: only active if explicitly enabled via env var
            const loggedIn = localStorage.getItem('gesta_admin_logged_in') === 'true';
            setSession(loggedIn ? { user: { email: 'simulation@local' } } : null);
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
