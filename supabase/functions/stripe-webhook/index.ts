import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables.")
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error("No stripe-signature header.")
    }

    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Retrieve line items to find the product ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      for (const item of lineItems.data) {
        const stripeProductId = item.price?.product as string
        if (stripeProductId) {
          // Find the product in Supabase
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('stripe_product_id', stripeProductId)
            .single()

          if (!fetchError && product) {
            const newQuantity = Math.max(0, (product.quantity || 1) - 1)
            const newStatus = newQuantity === 0 ? 'sold' : 'available'

            await supabase
              .from('products')
              .update({ quantity: newQuantity, status: newStatus })
              .eq('id', product.id)
            
            console.log(`Product ${product.title} updated: Quantity=${newQuantity}, Status=${newStatus}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error("Webhook processing error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
