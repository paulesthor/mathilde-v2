import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://paulesthor.github.io',
  'http://localhost:5173',
]

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { author_name, content, rating } = await req.json()

    if (!author_name || !content || !rating) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    if (author_name.length > 100 || content.length < 10 || content.length > 1000) {
      return new Response(JSON.stringify({ error: 'Données invalides' }), {
        status: 422, headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase.from('reviews').insert([{
      author_name,
      content,
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      status: 'pending',
      source: 'local',
    }])

    if (error) throw error

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (supabaseUrl) {
      fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          title: 'Nouvel avis à modérer',
          body: `${author_name} — "${content.substring(0, 60)}…"`,
          type: 'review',
        }),
      }).catch(() => {})
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('submit-review error:', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    })
  }
})
