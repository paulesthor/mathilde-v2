import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer la requête de pré-vérification CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error("La variable STRIPE_SECRET_KEY n'est pas configurée dans Supabase.")
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { title, price, description, image_url, quantity_limit } = await req.json()

    if (!title || !price) {
      throw new Error('Le titre et le prix sont obligatoires.')
    }

    // 1. Création du produit dans Stripe
    const product = await stripe.products.create({
      name: title,
      description: description || undefined,
      images: image_url ? [image_url] : undefined,
    })

    // 2. Création du tarif (Stripe prend les valeurs en centimes, donc * 100)
    const priceAmount = Math.round(parseFloat(price) * 100)
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: priceAmount,
      currency: 'eur',
    })

    // 3. Création du lien de paiement avec restriction de quantité si fournie
    const limitVal = quantity_limit ? parseInt(quantity_limit) : undefined
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: stripePrice.id,
          quantity: 1,
        },
      ],
      restrictions: limitVal && Number.isInteger(limitVal) && limitVal > 0 ? {
        completed_sessions: {
          limit: limitVal,
        },
      } : undefined,
    })

    return new Response(
      JSON.stringify({ payment_link: paymentLink.url, stripe_product_id: product.id }),
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
