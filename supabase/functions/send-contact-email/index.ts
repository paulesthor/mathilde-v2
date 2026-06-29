import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { firstName, lastName, email, phone, message } = await req.json()

    if (!firstName || !lastName || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Enregistrer en base
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('contact_requests')
      .insert([{ first_name: firstName, last_name: lastName, email, phone: phone || null, message }])

    if (dbError) {
      console.error('DB insert error:', dbError.message)
      return new Response(
        JSON.stringify({ error: 'Erreur enregistrement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Email via Resend (optionnel — si RESEND_API_KEY définie)
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const notifyEmail = Deno.env.get('CONTACT_NOTIFY_EMAIL') ?? 'contact@gesta-studio.com'
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Atelier Gesta <notifications@gesta-studio.com>',
          to: [notifyEmail],
          reply_to: email,
          subject: `Nouvelle demande de devis — ${firstName} ${lastName}`,
          html: `
            <h2>Nouvelle demande de devis reçue</h2>
            <table style="font-family:monospace;font-size:14px">
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Nom</td><td>${firstName} ${lastName}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Téléphone</td><td>${phone || 'Non renseigné'}</td></tr>
            </table>
            <h3 style="margin-top:24px">Projet</h3>
            <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${message}</p>
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:12px;color:#999">Demande reçue via le formulaire — Atelier Gesta</p>
          `,
        }),
      })
      if (!emailRes.ok) {
        console.error('Resend error:', await emailRes.text())
        // Ne bloque pas : la demande est déjà en base
      }
    }

    // 3. Push notification (fire-and-forget)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (supabaseUrl) {
      fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ title: 'Nouvelle demande de devis', body: `${firstName} ${lastName} — ${message.substring(0, 60)}…`, type: 'contact' }),
      }).catch(() => {})
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
