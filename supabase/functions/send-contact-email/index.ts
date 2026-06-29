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

    // 2. Emails via Resend (optionnel — si RESEND_API_KEY définie)
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const notifyEmail = Deno.env.get('CONTACT_NOTIFY_EMAIL') ?? 'contact@gesta-studio.com'

      // Email à Mathilde
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Atelier Gesta <notifications@gesta-studio.com>',
          to: [notifyEmail],
          reply_to: email,
          subject: `Nouvelle demande de devis — ${firstName} ${lastName}`,
          html: `<h2>Nouvelle demande de devis reçue</h2>
            <table style="font-family:monospace;font-size:14px">
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Nom</td><td>${firstName} ${lastName}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold">Téléphone</td><td>${phone || 'Non renseigné'}</td></tr>
            </table>
            <h3 style="margin-top:24px">Projet</h3>
            <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${message}</p>
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:12px;color:#999">Demande reçue via le formulaire — Atelier Gesta</p>`,
        }),
      }).catch(() => {})

      // Email de confirmation au client
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Atelier Gesta <notifications@gesta-studio.com>',
          to: [email],
          subject: 'Votre demande a bien été reçue — Atelier Gesta',
          html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <h1 style="font-size:28px;font-weight:400;margin-bottom:8px">Atelier Gesta</h1>
            <p style="font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#888;margin-bottom:32px">Tapisserie & Création sur-mesure</p>
            <p style="font-size:16px;line-height:1.7">Bonjour ${firstName},</p>
            <p style="font-size:16px;line-height:1.7">Votre demande de devis a bien été reçue. Mathilde reviendra vers vous dans les <strong>48h ouvrées</strong>.</p>
            <blockquote style="border-left:2px solid #d4c5b0;margin:24px 0;padding:12px 20px;color:#666;font-style:italic">"${message.substring(0, 120)}${message.length > 120 ? '…' : ''}"</blockquote>
            <p style="font-size:14px;color:#888;margin-top:40px">À très bientôt,<br><strong>Mathilde — Atelier Gesta</strong></p>
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:11px;color:#bbb">Cet email confirme la réception de votre demande. Pour toute question : <a href="mailto:${notifyEmail}" style="color:#888">${notifyEmail}</a></p>
          </div>`,
        }),
      }).catch(() => {})
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
