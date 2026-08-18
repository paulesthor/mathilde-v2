import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@17?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://paulesthor.github.io',
  'http://localhost:5173',
]

const ALLOWED_STATUSES = ['available', 'sold', 'archived']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Authentication check ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé : en-tête Authorization manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables serveur manquantes.")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide ou expiré' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { product_id, quantity, status } = await req.json()

    if (!product_id || typeof product_id !== 'string') {
      throw new Error('product_id manquant.')
    }
    if (quantity === undefined && status === undefined) {
      throw new Error('Aucune modification fournie (quantity ou status attendu).')
    }
    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      throw new Error('Statut invalide.')
    }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000)) {
      throw new Error('Quantité invalide (entier entre 0 et 100000).')
    }

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, quantity, status, stripe_payment_link_id')
      .eq('id', product_id)
      .single()

    if (fetchError || !product) {
      throw new Error('Produit introuvable.')
    }

    const updates: Record<string, unknown> = {}
    let nextStatus = product.status

    if (quantity !== undefined) {
      updates.quantity = quantity
      // Une quantité modifiée fait basculer le statut en vente/vendu,
      // sauf si l'article est volontairement archivé.
      if (product.status !== 'archived') {
        nextStatus = quantity <= 0 ? 'sold' : 'available'
        updates.status = nextStatus
      }
    }

    if (status !== undefined) {
      nextStatus = status
      updates.status = status
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', product_id)

    if (updateError) throw updateError

    // Synchronise l'état actif du lien de paiement Stripe avec la disponibilité réelle,
    // pour empêcher qu'un lien resté "vivant" permette d'acheter un article
    // marqué vendu/archivé, ou inversement bloque un article redevenu disponible.
    if (product.stripe_payment_link_id) {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
      if (stripeSecretKey) {
        try {
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
          })
          await stripe.paymentLinks.update(product.stripe_payment_link_id, {
            active: nextStatus === 'available',
          })
        } catch (stripeErr) {
          console.error('Failed to sync Stripe payment link:', (stripeErr as Error).message)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: nextStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('update-product error:', (error as Error).message)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la mise à jour du produit.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
