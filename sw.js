const CACHE = 'gesta-admin-v1';
const PRECACHE = ['/mathilde-v2/', '/mathilde-v2/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: toujours les données fraîches Supabase, fallback cache pour les assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Supabase API & Edge Functions → réseau uniquement, jamais de cache
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'Atelier Gesta', body: 'Nouvelle notification', type: 'general' };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  const icon = '/mathilde-v2/favicon.svg';
  const badge = '/mathilde-v2/favicon.svg';

  const urlMap = {
    order:   '/mathilde-v2/#/admin/orders',
    review:  '/mathilde-v2/#/admin/reviews',
    contact: '/mathilde-v2/#/admin/contacts',
  };
  const url = urlMap[data.type] ?? '/mathilde-v2/#/admin/orders';

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon,
      badge,
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url ?? '/mathilde-v2/#/admin/orders';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes('/mathilde-v2/'));
      if (existing) return existing.focus().then((c) => c.navigate(target));
      return clients.openWindow(target);
    })
  );
});
