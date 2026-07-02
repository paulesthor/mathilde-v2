import { useState, useEffect } from 'react';
import { X, Trash } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import AdminLayout from '../components/Layout/AdminLayout';
import { useToast } from '../contexts/ToastContext';

const STATUS_LABELS = { new: 'Nouveau', read: 'Lu', replied: 'Répondu' };
const STATUS_COLORS = { new: 'text-amber-600', read: 'text-blue-600', replied: 'text-emerald-600' };

function DetailPanel({ selected, updateStatus, deleteRequest }) {
    if (!selected) return <p className="font-mono text-sm text-muted-foreground tracking-widest">Sélectionnez une demande</p>;
    return (
        <div className="space-y-5 py-2">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="font-editorial text-2xl">{selected.first_name} {selected.last_name}</h2>
                    <a href={`mailto:${selected.email}`} className="font-mono text-xs text-primary hover:underline tracking-widest">
                        {selected.email}
                    </a>
                    {selected.phone && (
                        <p className="font-mono text-sm mt-1">
                            <a href={`tel:${selected.phone}`} className="text-muted-foreground hover:text-primary">{selected.phone}</a>
                        </p>
                    )}
                </div>
                <button
                    onClick={() => deleteRequest(selected.id)}
                    aria-label="Supprimer la demande"
                    title="Supprimer la demande"
                    className="p-2 border border-border text-muted-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all rounded shrink-0"
                >
                    <Trash className="h-4 w-4" />
                </button>
            </div>

            {/* Statut */}
            <div className="flex gap-2 flex-wrap">
                {Object.keys(STATUS_LABELS).map((s) => (
                    <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors ${
                            selected.status === s
                                ? 'bg-foreground text-background border-foreground'
                                : 'border-border hover:border-foreground/60'
                        }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Projet</p>
                <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div className="pt-2 border-t border-border">
                <a
                    href={`mailto:${selected.email}?subject=Re: Votre demande de devis — Atelier Gesta`}
                    onClick={() => updateStatus(selected.id, 'replied')}
                    className="inline-block w-full text-center font-mono text-xs uppercase tracking-widest py-4 bg-foreground text-background hover:bg-primary transition-colors"
                >
                    Répondre par email
                </a>
            </div>
        </div>
    );
}

export default function AdminContacts() {
    const { showToast } = useToast();
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

    const deleteRequest = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cette demande ?')) return;
        try {
            const { error } = await supabase.from('contact_requests').delete().eq('id', id);
            if (error) throw error;
            setRequests((prev) => prev.filter((r) => r.id !== id));
            if (selected?.id === id) setSelected(null);
            showToast('Demande supprimée.', 'success');
        } catch (err) {
            showToast('Erreur lors de la suppression : ' + err.message, 'error');
        }
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
                    <>
                    <div className="flex gap-8">
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

                        {/* Détail — desktop uniquement */}
                        <div className="hidden lg:block flex-1 border border-border p-8">
                            <DetailPanel selected={selected} updateStatus={updateStatus} deleteRequest={deleteRequest} onClose={() => setSelected(null)} />
                        </div>
                    </div>

                    {/* Drawer mobile — remonte du bas quand une demande est sélectionnée */}
                    {selected && (
                        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                            <div
                                className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
                                onClick={() => setSelected(null)}
                            />
                            <div
                                className="relative bg-background border-t border-border rounded-t-2xl overflow-y-auto"
                                style={{ maxHeight: '85vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
                            >
                                {/* Handle */}
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1 rounded-full bg-border" />
                                </div>
                                <div className="px-5 pb-2 flex items-center justify-between">
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Demande</span>
                                    <button onClick={() => setSelected(null)} aria-label="Fermer" className="text-muted-foreground hover:text-foreground p-1">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="px-5">
                                    <DetailPanel selected={selected} updateStatus={updateStatus} deleteRequest={deleteRequest} onClose={() => setSelected(null)} />
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}
        </AdminLayout>
    );
}
