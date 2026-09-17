import { supabase } from './supabaseClient';

// Suivi léger, best-effort : une visite ratée (réseau coupé, RLS, etc.) ne
// doit jamais gêner la navigation du visiteur, d'où le catch silencieux.

export function trackPageView(path) {
  supabase.from('analytics_events').insert({ event_type: 'page_view', path }).then(
    () => {},
    () => {}
  );
}

export function trackProductView(product) {
  if (!product) return;
  supabase.from('analytics_events').insert({
    event_type: 'product_view',
    product_id: product.id,
    product_title: product.title,
  }).then(
    () => {},
    () => {}
  );
}
