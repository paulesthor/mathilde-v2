import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@17?target=deno"

const ALLOWED_ORIGINS = [
  'https://paulesthor.github.io',
  'http://localhost:5173',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Fonction publique (pas d'authentification admin) : appelée depuis la page de
// confirmation d'achat par le client qui vient de payer. Ne renvoie que le
// résumé de SA propre commande, retrouvée via l'identifiant de session Stripe
// qu'il a lui-même reçu dans l'URL de retour — aucune énumération possible
// (identifiant Stripe non devinable) et aucune donnée sensible (pas de carte).
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error("La variable STRIPE_SECRET_KEY n'est pas configurée dans Supabase.")
    }

    const { session_id } = await req.json()

    if (!session_id || typeof session_id !== 'string' || !session_id.startsWith('cs_')) {
      return new Response(
        JSON.stringify({ error: 'Identifiant de session invalide.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items'],
    })

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Paiement non confirmé pour cette session.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lineItem = session.line_items?.data?.[0]
    const shipping = session.shipping_details?.address || session.customer_details?.address || null

    const summary = {
      product_title: lineItem?.description || 'Meuble d\'atelier',
      amount_total: (session.amount_total || 0) / 100,
      currency: session.currency || 'eur',
      customer_name: session.customer_details?.name || '',
      customer_email: session.customer_details?.email || '',
      shipping_address: shipping,
    }

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('get-checkout-session error:', (error as Error).message)
    return new Response(
      JSON.stringify({ error: "Impossible de récupérer le résumé de la commande." }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
