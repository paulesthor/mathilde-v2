import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import AdminLayout from '../components/Layout/AdminLayout';

const STATUS_LABELS = { new: 'Nouveau', read: 'Lu', replied: 'Répondu' };
const STATUS_COLORS = { new: 'text-amber-600', read: 'text-blue-600', replied: 'text-emerald-600' };

export default function AdminContacts() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('contact_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setRequests(data ?? []);
        setLoading(false);
    };

    const updateStatus = async (id, status) => {
        await supabase.from('contact_requests').update({ status }).eq('id', id);
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        if (selected?.id === id) setSelected((prev) => ({ ...prev, status }));
    };

    const newCount = requests.filter((r) => r.status === 'new').length;

    return (
        <AdminLayout activeTab="contacts" title="Demandes">
                <header className="mb-12">
                    <h1 className="font-editorial text-5xl tracking-tight mb-2">Demandes de contact</h1>
                    {newCount > 0 && (
                        <p className="font-mono text-xs uppercase tracking-widest text-amber-600">
                            {newCount} nouvelle{newCount > 1 ? 's' : ''} demande{newCount > 1 ? 's' : ''}
                        </p>
                    )}
                </header>

                {loading ? (
                    <p className="font-mono text-sm tracking-widest">Chargement…</p>
                ) : requests.length === 0 ? (
                    <p className="font-sans text-muted-foreground">Aucune demande pour le moment.</p>
                ) : (
                    <div className="flex gap-8">
                        {/* Liste */}
                        <div className="w-full lg:w-2/5 space-y-2">
                            {requests.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelected(r)}
                                    className={`w-full text-left p-4 border transition-colors ${
                                        selected?.id === r.id
                                            ? 'border-foreground bg-muted/30'
                                            : 'border-border hover:border-foreground/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-sans font-medium text-sm">
                                            {r.first_name} {r.last_name}
                                        </span>
                                        <span className={`font-mono text-[10px] uppercase tracking-widest ${STATUS_COLORS[r.status]}`}>
                                            {STATUS_LABELS[r.status]}
                                        </span>
                                    </div>
                                    <p className="font-mono text-xs text-muted-foreground truncate">{r.email}</p>
                                    <p className="font-sans text-xs text-muted-foreground mt-1 truncate">{r.message}</p>
                                    <p className="font-mono text-[10px] text-muted-foreground/60 mt-2">
                                        {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Détail */}
                        <div className="hidden lg:block flex-1 border border-border p-8">
                            {selected ? (
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="font-editorial text-3xl">{selected.first_name} {selected.last_name}</h2>
                                            <a href={`mailto:${selected.email}`} className="font-mono text-xs text-primary hover:underline tracking-widest">
                                                {selected.email}
                                            </a>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            {Object.keys(STATUS_LABELS).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateStatus(selected.id, s)}
                                                    className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 border transition-colors ${
                                                        selected.status === s
                                                            ? 'bg-foreground text-background border-foreground'
                                                            : 'border-border hover:border-foreground/60'
                                                    }`}
                                                >
                                                    {STATUS_LABELS[s]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selected.phone && (
                                        <p className="font-mono text-sm">
                                            <span className="text-muted-foreground uppercase tracking-widest text-xs mr-3">Tél.</span>
                                            <a href={`tel:${selected.phone}`} className="hover:text-primary">{selected.phone}</a>
                                        </p>
                                    )}

                                    <div>
                                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Projet</p>
                                        <p className="font-sans text-base leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <a
                                            href={`mailto:${selected.email}?subject=Re: Votre demande de devis — Atelier Gesta`}
                                            onClick={() => updateStatus(selected.id, 'replied')}
                                            className="inline-block font-mono text-xs uppercase tracking-widest py-3 px-6 bg-foreground text-background hover:bg-primary transition-colors"
                                        >
                                            Répondre par email
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className="font-mono text-sm text-muted-foreground tracking-widest">Sélectionnez une demande</p>
                            )}
                        </div>
                    </div>
                )}
        </AdminLayout>
    );
}
