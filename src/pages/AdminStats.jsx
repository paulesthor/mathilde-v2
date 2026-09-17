import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Euro, ShoppingBag, TrendingUp, Eye, Trophy } from 'lucide-react';
import AdminLayout from '../components/Layout/AdminLayout';

const PAGE_LABELS = {
    '/': 'Accueil',
    '/realisations': 'Réalisations',
    '/prestations': 'Prestations',
    '/creations': 'Créations',
    '/dispo': 'Pièces disponibles',
    '/about': 'À propos',
    '/contact': 'Contact',
};

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function startOfPeriod(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function KpiCard({ icon: Icon, label, value, sub }) {
    return (
        <div className="border border-border rounded-lg p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={14} strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
            </div>
            <span className="font-editorial text-3xl leading-none">{value}</span>
            {sub && <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>}
        </div>
    );
}

function RankedList({ title, icon: Icon, rows, emptyLabel }) {
    const max = rows.length > 0 ? rows[0].count : 0;
    return (
        <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Icon size={14} strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest">{title}</span>
            </div>
            {rows.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground">{emptyLabel}</p>
            ) : (
                <div className="space-y-3">
                    {rows.map((row) => (
                        <div key={row.label}>
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="font-sans text-sm truncate pr-2">{row.label}</span>
                                <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                                    {row.count}{row.extra ? ` · ${row.extra}` : ''}
                                </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${max ? (row.count / max) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminStats() {
    const [orders, setOrders] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [ordersRes, eventsRes] = await Promise.all([
                supabase
                    .from('orders')
                    .select('amount_total, product_title, created_at')
                    .eq('status', 'paid'),
                supabase
                    .from('analytics_events')
                    .select('event_type, path, product_title, created_at')
                    .gte('created_at', startOfPeriod(90)),
            ]);
            setOrders(ordersRes.data || []);
            setEvents(eventsRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const totalSales = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0);
        const avgBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

        const last30 = startOfPeriod(30);
        const revenue30d = orders
            .filter((o) => o.created_at >= last30)
            .reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0);

        const bestSellers = Object.values(
            orders.reduce((acc, o) => {
                const key = o.product_title || 'Sans titre';
                acc[key] = acc[key] || { label: key, count: 0, revenue: 0 };
                acc[key].count += 1;
                acc[key].revenue += Number(o.amount_total) || 0;
                return acc;
            }, {})
        )
            .map((r) => ({ ...r, extra: EUR.format(r.revenue) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const pageViews = events.filter((e) => e.event_type === 'page_view');
        const productViews = events.filter((e) => e.event_type === 'product_view');
        const views30d = pageViews.filter((e) => e.created_at >= last30).length;

        const topPages = Object.values(
            pageViews.reduce((acc, e) => {
                const key = e.path || '?';
                acc[key] = acc[key] || { label: PAGE_LABELS[key] || key, count: 0 };
                acc[key].count += 1;
                return acc;
            }, {})
        )
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topProducts = Object.values(
            productViews.reduce((acc, e) => {
                const key = e.product_title || 'Sans titre';
                acc[key] = acc[key] || { label: key, count: 0 };
                acc[key].count += 1;
                return acc;
            }, {})
        )
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { totalSales, totalRevenue, avgBasket, revenue30d, bestSellers, views30d, totalViews: pageViews.length, topPages, topProducts };
    }, [orders, events]);

    return (
        <AdminLayout activeTab="stats" title="Statistiques">
            {loading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <p className="font-mono text-sm tracking-widest text-muted-foreground">Chargement…</p>
                </div>
            ) : (
                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <KpiCard icon={ShoppingBag} label="Ventes totales" value={stats.totalSales} />
                        <KpiCard icon={Euro} label="CA total" value={EUR.format(stats.totalRevenue)} />
                        <KpiCard icon={TrendingUp} label="CA (30j)" value={EUR.format(stats.revenue30d)} />
                        <KpiCard icon={Euro} label="Panier moyen" value={stats.totalSales > 0 ? EUR.format(stats.avgBasket) : '—'} />
                    </div>

                    <KpiCard icon={Eye} label="Visites (30 derniers jours)" value={stats.views30d} sub={`${stats.totalViews} vues sur 90 jours`} />

                    <RankedList
                        title="Meilleures ventes"
                        icon={Trophy}
                        rows={stats.bestSellers}
                        emptyLabel="Aucune vente pour le moment."
                    />

                    <RankedList
                        title="Pièces les plus consultées (90j)"
                        icon={Eye}
                        rows={stats.topProducts}
                        emptyLabel="Pas encore de données de consultation."
                    />

                    <RankedList
                        title="Pages les plus visitées (90j)"
                        icon={TrendingUp}
                        rows={stats.topPages}
                        emptyLabel="Pas encore de données de visite."
                    />

                    <p className="font-mono text-[10px] text-muted-foreground text-center pt-2">
                        Statistique maison, légère : nombre de vues brutes (pas de visiteurs uniques).
                    </p>
                </div>
            )}
        </AdminLayout>
    );
}
