import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@17?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // --- Stripe setup ---
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error("La variable STRIPE_SECRET_KEY n'est pas configurée dans Supabase.")
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { title, price, description, image_url, quantity_limit } = await req.json()

    // --- Input validation ---
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
      throw new Error('Titre invalide (obligatoire, max 200 caractères).')
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 1 || parsedPrice > 50000) {
      throw new Error('Prix invalide (doit être entre 1 € et 50 000 €).')
    }

    if (description && (typeof description !== 'string' || description.length > 2000)) {
      throw new Error('Description trop longue (max 2000 caractères).')
    }

    const limitVal = quantity_limit ? parseInt(quantity_limit) : undefined
    if (limitVal !== undefined && (isNaN(limitVal) || limitVal < 1 || limitVal > 1000)) {
      throw new Error('Quantité limite invalide (entre 1 et 1000).')
    }

    // 1. Product creation
    const product = await stripe.products.create({
      name: title.trim(),
      description: description || undefined,
      images: image_url ? [image_url] : undefined,
    })

    // 2. Price creation (Stripe uses cents)
    const priceAmount = Math.round(parsedPrice * 100)
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: priceAmount,
      currency: 'eur',
    })

    // Le client doit revenir sur le site après paiement, avec le résumé de sa commande,
    // au lieu de rester sur la page de confirmation générique de Stripe.
    const origin = req.headers.get('Origin') || ''
    const siteBase = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    const successUrl = `${siteBase}/mathilde-v2/#/success?session_id={CHECKOUT_SESSION_ID}`

    // 3. Payment link with optional quantity restriction and customer details collection
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'DE', 'IT', 'ES', 'NL', 'IE', 'GB'],
      },
      restrictions: limitVal && Number.isInteger(limitVal) && limitVal > 0 ? {
        completed_sessions: {
          limit: limitVal,
        },
      } : undefined,
      after_completion: {
        type: 'redirect',
        redirect: { url: successUrl },
      },
    })

    return new Response(
      JSON.stringify({ payment_link: paymentLink.url, payment_link_id: paymentLink.id, stripe_product_id: product.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
