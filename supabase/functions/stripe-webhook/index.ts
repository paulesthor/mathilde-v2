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
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Extract customer details and shipping address
      const customerName = session.customer_details?.name || ''
      const customerEmail = session.customer_details?.email || ''
      const customerPhone = session.customer_details?.phone || ''
      const shippingAddress = session.shipping_details?.address || session.customer_details?.address || null
      const amountTotal = (session.amount_total || 0) / 100

      for (const item of lineItems.data) {
        const stripeProductId = item.price?.product as string
        const productTitle = item.description || 'Meuble d\'atelier'
        
        if (stripeProductId) {
          // 1. Atomic decrement using PostgreSQL RPC
          const { error: rpcError } = await supabase.rpc('decrement_product_quantity', {
            p_stripe_product_id: stripeProductId
          })

          if (rpcError) {
            console.error(`RPC decrement failed for ${stripeProductId}:`, rpcError.message)
            
            // Fallback: use standard update (less safe but functional)
            const { data: product, error: fetchError } = await supabase
              .from('products')
              .select('id, quantity')
              .eq('stripe_product_id', stripeProductId)
              .single()

            if (!fetchError && product) {
              const newQuantity = Math.max(0, (product.quantity || 1) - 1)
              const newStatus = newQuantity === 0 ? 'sold' : 'available'

              await supabase
                .from('products')
                .update({ quantity: newQuantity, status: newStatus })
                .eq('id', product.id)
            }
          }

          // 2. Upsert order — idempotent on stripe_session_id to handle duplicate webhook delivery
          const { error: orderError } = await supabase
            .from('orders')
            .upsert([{
              stripe_session_id: session.id,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              shipping_address: shippingAddress,
              amount_total: amountTotal,
              product_title: productTitle,
              stripe_product_id: stripeProductId,
              status: 'paid'
            }], { onConflict: 'stripe_session_id', ignoreDuplicates: true })

          if (orderError) {
            console.error(`Failed to register order for session ${session.id}:`, orderError.message)
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    console.error("Webhook processing error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
