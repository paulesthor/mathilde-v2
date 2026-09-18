import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import {
    Euro, ShoppingBag, TrendingUp, TrendingDown, Eye, Trophy,
    Package, Star, MessageSquare, Percent,
} from 'lucide-react';
import AdminLayout from '../components/Layout/AdminLayout';
import { useAdminCounts } from '../hooks/useAdminCounts';

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
const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
const MONTH_YEAR_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Calcul des périodes (calendaires, pas de fenêtres glissantes en jours) ---

function normalizeYM({ year, month }) {
    let y = year, m = month;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    return { year: y, month: m };
}

function startOfMonth(year, month) {
    return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(year, month) {
    return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

// endYM = dernier mois inclus dans la période, span = nombre de mois
function rangeFromMonths(endYM, span) {
    const end = normalizeYM(endYM);
    const start = normalizeYM({ year: end.year, month: end.month - (span - 1) });
    return { start: startOfMonth(start.year, start.month), end: endOfMonth(end.year, end.month), startYM: start, endYM: end };
}

function getPeriodRange(period) {
    const now = new Date();
    let endYM, span;

    if (period.type === 'specific_month') {
        endYM = { year: period.year, month: period.month };
        span = 1;
    } else if (period.type === 'last_month') {
        endYM = normalizeYM({ year: now.getFullYear(), month: now.getMonth() - 1 });
        span = 1;
    } else if (period.type === 'last_3_months') {
        endYM = normalizeYM({ year: now.getFullYear(), month: now.getMonth() - 1 });
        span = 3;
    } else {
        // last_year : année calendaire précédente
        endYM = { year: now.getFullYear() - 1, month: 11 };
        span = 12;
    }

    const { start, end, startYM } = rangeFromMonths(endYM, span);

    // Période précédente : même durée, immédiatement avant
    const prevEndYM = normalizeYM({ year: startYM.year, month: startYM.month - 1 });
    const { start: prevStart, end: prevEnd } = rangeFromMonths(prevEndYM, span);

    let label;
    if (period.type === 'last_year') label = String(endYM.year);
    else if (span === 1) label = capitalize(MONTH_YEAR_FMT.format(start));
    else label = `${capitalize(MONTH_FMT.format(start))} – ${capitalize(MONTH_YEAR_FMT.format(end))}`;

    return { start, end, prevStart, prevEnd, label };
}

function monthOptions() {
    const now = new Date();
    const opts = [];
    for (let i = 0; i < 24; i++) {
        const { year, month } = normalizeYM({ year: now.getFullYear(), month: now.getMonth() - i });
        opts.push({ year, month, label: capitalize(MONTH_YEAR_FMT.format(new Date(year, month, 1))) });
    }
    return opts;
}

// --- Regroupement en points temporels pour les mini-graphiques ---

function bucketKey(date, type) {
    if (type === 'day') return date.toISOString().slice(0, 10);
    if (type === 'week') {
        const d = new Date(date);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return d.toISOString().slice(0, 10);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildTimeline(start, end, items, dateField, valueFn = () => 1) {
    const spanDays = (end - start) / 86400000;
    const type = spanDays <= 35 ? 'day' : spanDays <= 200 ? 'week' : 'month';
    const buckets = new Map();
    const cursor = new Date(start);
    let guard = 0;
    while (cursor <= end && guard < 400) {
        buckets.set(bucketKey(cursor, type), 0);
        if (type === 'day') cursor.setDate(cursor.getDate() + 1);
        else if (type === 'week') cursor.setDate(cursor.getDate() + 7);
        else cursor.setMonth(cursor.getMonth() + 1);
        guard += 1;
    }
    items.forEach((item) => {
        const key = bucketKey(new Date(item[dateField]), type);
        if (buckets.has(key)) buckets.set(key, buckets.get(key) + valueFn(item));
    });
    return Array.from(buckets.entries()).map(([key, count]) => ({ key, count }));
}

// --- UI ---

function DeltaBadge({ current, previous }) {
    if (!previous) {
        return <span className="font-mono text-[10px] text-muted-foreground">—</span>;
    }
    const pct = ((current - previous) / previous) * 100;
    const isUp = pct >= 0;
    const Icon = isUp ? TrendingUp : TrendingDown;
    return (
        <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            <Icon size={10} strokeWidth={2} />
            {isUp ? '+' : ''}{pct.toFixed(0)}% vs période préc.
        </span>
    );
}

function KpiCard({ icon: Icon, label, value, sub, delta, to }) {
    const content = (
        <div className="border border-border rounded-lg p-4 flex flex-col gap-1 h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={14} strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
            </div>
            <span className="font-editorial text-3xl leading-none">{value}</span>
            {delta}
            {sub && <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>}
        </div>
    );
    return to ? <Link to={to}>{content}</Link> : content;
}

function RankedList({ title, icon: Icon, rows, emptyLabel }) {
    const max = rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 0;
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

function Sparkline({ title, icon: Icon, data, formatValue }) {
    const max = Math.max(1, ...data.map((d) => d.count));
    const hasData = data.some((d) => d.count > 0);
    return (
        <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Icon size={14} strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-widest">{title}</span>
            </div>
            {!hasData ? (
                <p className="font-sans text-sm text-muted-foreground">Pas encore de données sur cette période.</p>
            ) : (
                <div className="flex items-end gap-1 h-20">
                    {data.map((d) => (
                        <div key={d.key} className="flex-1 h-full flex flex-col justify-end" title={formatValue ? formatValue(d.count) : String(d.count)}>
                            <div
                                className="bg-primary rounded-sm"
                                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '3px' : '0' }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const PRESETS = [
    { type: 'last_month', label: 'Mois dernier' },
    { type: 'last_3_months', label: '3 derniers mois' },
    { type: 'last_year', label: 'Année dernière' },
];

export default function AdminStats() {
    const [period, setPeriod] = useState({ type: 'last_month' });
    const [orders, setOrders] = useState([]);
    const [events, setEvents] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const counts = useAdminCounts();

    const range = useMemo(() => getPeriodRange(period), [period]);
    const months = useMemo(() => monthOptions(), []);
    const isSpecificMonth = period.type === 'specific_month';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [ordersRes, eventsRes, productsRes] = await Promise.all([
                supabase
                    .from('orders')
                    .select('amount_total, product_title, created_at')
                    .eq('status', 'paid')
                    .gte('created_at', range.prevStart.toISOString())
                    .lte('created_at', range.end.toISOString()),
                supabase
                    .from('analytics_events')
                    .select('event_type, path, product_title, created_at')
                    .gte('created_at', range.prevStart.toISOString())
                    .lte('created_at', range.end.toISOString()),
                supabase
                    .from('products')
                    .select('price, quantity')
                    .eq('status', 'available'),
            ]);
            setOrders(ordersRes.data || []);
            setEvents(eventsRes.data || []);
            setProducts(productsRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, [range.prevStart, range.end]);

    const stats = useMemo(() => {
        const inRange = (row, start, end) => row.created_at >= start.toISOString() && row.created_at <= end.toISOString();

        const currentOrders = orders.filter((o) => inRange(o, range.start, range.end));
        const prevOrders = orders.filter((o) => inRange(o, range.prevStart, range.prevEnd));
        const currentEvents = events.filter((e) => inRange(e, range.start, range.end));

        const totalSales = currentOrders.length;
        const prevSales = prevOrders.length;
        const totalRevenue = currentOrders.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0);
        const prevRevenue = prevOrders.reduce((sum, o) => sum + (Number(o.amount_total) || 0), 0);
        const avgBasket = totalSales > 0 ? totalRevenue / totalSales : 0;

        const bestSellers = Object.values(
            currentOrders.reduce((acc, o) => {
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

        const pageViews = currentEvents.filter((e) => e.event_type === 'page_view');
        const prevPageViews = events.filter((e) => e.event_type === 'page_view' && inRange(e, range.prevStart, range.prevEnd));
        const productViews = currentEvents.filter((e) => e.event_type === 'product_view');

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

        // Taux de conversion consultation -> vente, par pièce
        const conversionMap = new Map();
        productViews.forEach((e) => {
            const key = e.product_title || 'Sans titre';
            if (!conversionMap.has(key)) conversionMap.set(key, { label: key, views: 0, sales: 0 });
            conversionMap.get(key).views += 1;
        });
        currentOrders.forEach((o) => {
            const key = o.product_title || 'Sans titre';
            if (!conversionMap.has(key)) conversionMap.set(key, { label: key, views: 0, sales: 0 });
            conversionMap.get(key).sales += 1;
        });
        const conversion = Array.from(conversionMap.values())
            .filter((r) => r.views > 0)
            .map((r) => ({ ...r, count: r.views, extra: `${r.sales} vente${r.sales === 1 ? '' : 's'} · ${((r.sales / r.views) * 100).toFixed(0)}%` }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        const stockValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 1), 0);

        const revenueTimeline = buildTimeline(range.start, range.end, currentOrders, 'created_at', (o) => Number(o.amount_total) || 0);
        const visitsTimeline = buildTimeline(range.start, range.end, pageViews, 'created_at');

        return {
            totalSales, prevSales, totalRevenue, prevRevenue, avgBasket,
            bestSellers, topPages, topProducts, conversion, stockValue,
            totalViews: pageViews.length, prevViews: prevPageViews.length,
            revenueTimeline, visitsTimeline,
        };
    }, [orders, events, products, range]);

    return (
        <AdminLayout activeTab="stats" title="Statistiques">
            <div className="space-y-6 py-4">
                {/* Sélecteur de période */}
                <div className="space-y-2">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {PRESETS.map((p) => (
                            <button
                                key={p.type}
                                onClick={() => setPeriod({ type: p.type })}
                                className={`flex-shrink-0 font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded-full border transition-colors ${
                                    !isSpecificMonth && period.type === p.type
                                        ? 'bg-foreground text-background border-foreground'
                                        : 'border-border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <select
                        value={isSpecificMonth ? `${period.year}-${period.month}` : ''}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [year, month] = e.target.value.split('-').map(Number);
                            setPeriod({ type: 'specific_month', year, month });
                        }}
                        className="w-full bg-transparent border border-border rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-foreground"
                    >
                        <option value="">Ou choisir un mois précis…</option>
                        {months.map((m) => (
                            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
                        ))}
                    </select>
                    <p className="font-mono text-[10px] text-muted-foreground text-center pt-1">Période : {range.label}</p>
                </div>

                {loading ? (
                    <div className="min-h-[30vh] flex items-center justify-center">
                        <p className="font-mono text-sm tracking-widest text-muted-foreground">Chargement…</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <KpiCard
                                icon={ShoppingBag} label="Ventes" value={stats.totalSales}
                                delta={<DeltaBadge current={stats.totalSales} previous={stats.prevSales} />}
                            />
                            <KpiCard
                                icon={Euro} label="CA" value={EUR.format(stats.totalRevenue)}
                                delta={<DeltaBadge current={stats.totalRevenue} previous={stats.prevRevenue} />}
                            />
                            <KpiCard icon={Euro} label="Panier moyen" value={stats.totalSales > 0 ? EUR.format(stats.avgBasket) : '—'} />
                            <KpiCard
                                icon={Eye} label="Visites" value={stats.totalViews}
                                delta={<DeltaBadge current={stats.totalViews} previous={stats.prevViews} />}
                            />
                        </div>

                        {/* Aperçu indépendant de la période sélectionnée */}
                        <div className="grid grid-cols-2 gap-3">
                            <KpiCard icon={Package} label="Valeur du stock" value={EUR.format(stats.stockValue)} sub="Pièces disponibles" />
                            <KpiCard icon={Star} label="Avis en attente" value={counts.reviews} to="/admin/reviews" />
                        </div>
                        <KpiCard icon={MessageSquare} label="Demandes de contact non traitées" value={counts.contacts} to="/admin/contacts" />

                        <Sparkline
                            title="Chiffre d'affaires dans le temps"
                            icon={TrendingUp}
                            data={stats.revenueTimeline}
                            formatValue={(v) => EUR.format(v)}
                        />

                        <Sparkline
                            title="Visites dans le temps"
                            icon={Eye}
                            data={stats.visitsTimeline}
                            formatValue={(v) => `${v} visite${v === 1 ? '' : 's'}`}
                        />

                        <RankedList
                            title="Meilleures ventes"
                            icon={Trophy}
                            rows={stats.bestSellers}
                            emptyLabel="Aucune vente sur cette période."
                        />

                        <RankedList
                            title="Taux de conversion (consultation → vente)"
                            icon={Percent}
                            rows={stats.conversion}
                            emptyLabel="Pas encore de données de consultation."
                        />

                        <RankedList
                            title="Pièces les plus consultées"
                            icon={Eye}
                            rows={stats.topProducts}
                            emptyLabel="Pas encore de données de consultation."
                        />

                        <RankedList
                            title="Pages les plus visitées"
                            icon={TrendingUp}
                            rows={stats.topPages}
                            emptyLabel="Pas encore de données de visite."
                        />
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
