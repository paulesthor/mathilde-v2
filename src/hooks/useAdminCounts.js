import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useAdminCounts() {
    const [counts, setCounts] = useState({ orders: 0, reviews: 0, contacts: 0 });

    const refresh = async () => {
        const [orders, reviews, contacts] = await Promise.all([
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
            supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ]);
        setCounts({
            orders: orders.count ?? 0,
            reviews: reviews.count ?? 0,
            contacts: contacts.count ?? 0,
        });
    };

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 30000);
        return () => clearInterval(id);
    }, []);

    return counts;
}
