import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../utils/supabaseClient';
import { KeyRound, Mail, AlertCircle, Database } from 'lucide-react';

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK === 'true';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (MOCK_ENABLED) {
            if (localStorage.getItem('gesta_admin_logged_in') === 'true') {
                navigate('/admin/products');
            }
        } else {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) navigate('/admin/products');
            });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (MOCK_ENABLED) {
            // Mock authentication — only active in dev with VITE_ENABLE_MOCK=true
            if (email && password) {
                localStorage.setItem('gesta_admin_logged_in', 'true');
                navigate('/admin/products');
            } else {
                setError("Veuillez remplir tous les champs.");
            }
            setLoading(false);
        } else {
            // Live Supabase authentication
            try {
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (authError) throw authError;
                navigate('/admin/products');
            } catch {
                setError("Identifiants ou mot de passe incorrect.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen flex items-center justify-center text-foreground px-6 py-24">
            <Helmet>
                <title>Connexion — Admin Gesta</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className="w-full max-w-md border border-border/80 p-8 md:p-12 rounded-lg bg-muted/5 relative overflow-hidden">

                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-8 relative">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                        Espace Restreint
                    </span>
                    <h1 className="font-editorial text-4xl md:text-5xl mt-3">
                        Connexion.
                    </h1>
                    <p className="font-sans font-light text-muted-foreground text-xs mt-2">
                        Veuillez vous authentifier pour accéder à l'administration.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                            <Mail className="h-3 w-3" /> E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                            placeholder="admin@exemple.com"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                            <KeyRound className="h-3 w-3" /> Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border px-4 py-3 font-sans text-sm focus:border-primary outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="flex gap-2 p-4 bg-rose-500/5 border border-rose-500/20 text-rose-500 rounded text-xs leading-relaxed font-sans">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest py-4 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                {MOCK_ENABLED && (
                    <div className="mt-8 pt-6 border-t border-border/40 flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 px-4 py-3 rounded-lg text-amber-600 dark:text-amber-400">
                        <Database className="h-4 w-4 shrink-0" />
                        <div className="font-mono text-[9px] uppercase tracking-wider leading-relaxed">
                            Mode Simulation hors ligne activé.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
