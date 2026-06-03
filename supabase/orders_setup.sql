-- Création de la table des commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address JSONB,
    amount_total NUMERIC(10, 2),
    product_title TEXT,
    stripe_product_id TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Suppression de l'ancienne politique si existante
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON public.orders;

-- Politique pour autoriser uniquement les administrateurs connectés (authenticated) à lire les commandes
CREATE POLICY "Allow authenticated users to read orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (true);
