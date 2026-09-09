import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

serve(async (req) => {
  const debugToken = Deno.env.get('DEBUG_CHECK_TOKEN')
  const authHeader = req.headers.get('Authorization')
  if (!debugToken || authHeader !== `Bearer ${debugToken}`) {
    return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 })
  }

  const raw = Deno.env.get('ADMIN_EMAILS') ?? ''
  const parsed = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

  return new Response(JSON.stringify({ count: parsed.length, emails: parsed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
