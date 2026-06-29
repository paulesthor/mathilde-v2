import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Database, Package, User, Mail, Phone, MapPin, Calendar, CreditCard, ChevronRight } from 'lucide-react';

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK === 'true';

const DEFAULT_ORDERS = [
    {
        id: '1',
        stripe_session_id: 'cs_test_a1',
        product_title: 'Chauffeuse 70s',
        customer_name: 'Pauline Rousseau',
        customer_email: 'pauline.r@example.com',
        customer_phone: '+33 6 12 34 56 78',
        shipping_address: {
            line1: '14 Rue de la Paix',
            city: 'Paris',
            postal_code: '75002',
            country: 'FR'
        },
        amount_total: 450.00,
        status: 'paid',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
        id: '2',
        stripe_session_id: 'cs_test_a2',
        product_title: 'Paire de Bridge',
        customer_name: 'Victor Clement',
        customer_email: 'v.clement@example.com',
        customer_phone: '+33 7 98 76 54 32',
        shipping_address: {
            line1: '8 Avenue Foch',
            city: 'Lille',
            postal_code: '59000',
            country: 'FR'
        },
        amount_total: 890.00,
        status: 'paid',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
    }
];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUsingMock, setIsUsingMock] = useState(false);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            if (MOCK_ENABLED) {
                throw new Error("Mode simulation activé");
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOrders(data || []);
            setIsUsingMock(false);
        } catch (err) {
            if (MOCK_ENABLED) {
                const localData = localStorage.getItem('gesta_orders');
                if (localData) {
                    setOrders(JSON.parse(localData));
                } else {
                    localStorage.setItem('gesta_orders', JSON.stringify(DEFAULT_ORDERS));
                    setOrders(DEFAULT_ORDERS);
                }
                setIsUsingMock(true);
            } else {
                setOrders([]);
                setIsUsingMock(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleLogout = async () => {
        if (MOCK_ENABLED) {
            localStorage.removeItem('gesta_admin_logged_in');
            navigate('/');
        } else {
            await supabase.auth.signOut();
            navigate('/');
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddress = (address) => {
        if (!address) return "Retrait à l'atelier (Pas d'adresse)";
        if (typeof address === 'string') return address;
        const { line1, line2, postal_code, city, country } = address;
        return `${line1}${line2 ? `, ${line2}` : ''} - ${postal_code} ${city} (${country})`;
    };

    return (
        <div className="animate-in fade-in duration-1000 bg-background min-h-screen pt-32 pb-24 text-foreground">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">

                {/* Internal Admin Navigation Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 border border-border/50 px-6 py-4 rounded-lg mb-12 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="font-bold text-primary tracking-widest uppercase">Gesta Admin</span>
                        <span className="text-muted-foreground/30 hidden sm:inline">|</span>
                        <Link to="/admin/products" className="hover:text-primary transition-colors text-muted-foreground hover:underline underline-offset-4">Catalogue</Link>
                        <Link to="/admin/orders" className="hover:text-primary transition-colors font-bold underline underline-offset-4">Commandes</Link>
                        <Link to="/admin/reviews" className="hover:text-primary transition-colors text-muted-foreground hover:underline underline-offset-4">Modération Avis</Link>
                        <Link to="/admin/contacts" className="hover:text-primary transition-colors text-muted-foreground hover:underline underline-offset-4">Demandes</Link>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-wider text-[10px]"
                    >
                        Se déconnecter
                    </button>
                </div>

                <header className="mb-16 border-b border-border/40 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                            Espace Ventes
                        </span>
                        <h1 className="font-editorial text-5xl md:text-7xl mt-4">
                            Historique des commandes.
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/30 border border-border/80 px-4 py-3 rounded-lg">
                        <Database className={`h-5 w-5 ${isUsingMock ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className="font-mono text-xs uppercase tracking-widest">
                            {isUsingMock ? 'Mode Simulation' : 'Supabase Connecté'}
                        </span>
                    </div>
                </header>

                {loading ? (
                    <div className="min-h-[40vh] flex items-center justify-center">
                        <p className="font-mono text-sm tracking-widest">Chargement de l'historique...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="min-h-[40vh] flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg p-12 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="font-sans font-light text-muted-foreground">Aucune commande enregistrée pour le moment.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div 
                                key={order.id} 
                                className="border border-border/60 rounded-lg p-6 md:p-8 hover:border-primary/40 transition-colors bg-muted/5 flex flex-col lg:flex-row justify-between gap-8"
                            >
                                {/* Commande & Article */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold">
                                            {order.status === 'paid' ? 'Payé' : order.status}
                                        </span>
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(order.created_at)}
                                        </span>
                                        <span className="text-muted-foreground select-all bg-muted px-2 py-0.5 rounded text-[10px]">
                                            Session ID: {order.stripe_session_id.substring(0, 15)}...
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-editorial text-2xl md:text-3xl text-foreground">
                                                {order.product_title}
                                            </h3>
                                            <p className="font-mono text-sm text-primary font-bold mt-1">
                                                {typeof order.amount_total === 'number' ? `${order.amount_total.toFixed(2)} €` : order.amount_total}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Infos Client & Livraison */}
                                <div className="flex-1 border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-8 flex flex-col md:flex-row gap-6 md:gap-12 justify-between">
                                    <div className="space-y-3 font-sans font-light text-sm md:text-base text-foreground/80">
                                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            Client
                                        </h4>
                                        <p className="font-bold text-foreground">{order.customer_name}</p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <a href={`mailto:${order.customer_email}`} className="hover:text-primary transition-colors select-all">
                                                {order.customer_email}
                                            </a>
                                        </p>
                                        {order.customer_phone && (
                                            <p className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <a href={`tel:${order.customer_phone}`} className="hover:text-primary transition-colors select-all">
                                                    {order.customer_phone}
                                                </a>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3 font-sans font-light text-sm md:text-base text-foreground/80 flex-1 max-w-sm">
                                        <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Livraison
                                        </h4>
                                        <p className="leading-relaxed select-all">
                                            {formatAddress(order.shipping_address)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
