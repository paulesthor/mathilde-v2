import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// Injecte un instantané du contenu éditable (site_content) directement dans
// index.html au moment du build : les nouveaux visiteurs (qui n'ont encore
// aucun cache local) voient tout de suite les vraies photos/textes
// enregistrés, sans devoir attendre l'appel réseau côté client — qui
// affichait sinon brièvement les valeurs par défaut avant de basculer sur
// le vrai contenu.
function siteContentSnapshotPlugin(supabaseUrl, supabaseAnonKey) {
  return {
    name: 'inject-site-content-snapshot',
    apply: 'build',
    async transformIndexHtml() {
      let json = '[]'
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/site_content?select=id,page,section,kind,title,text_value,image_url,extra,sort_order`,
            { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } }
          )
          if (res.ok) json = await res.text()
        } catch {
          // Échec réseau au moment du build : tant pis, le site retombe sur
          // le fetch classique côté client (comportement inchangé).
        }
      }
      return [{
        tag: 'script',
        injectTo: 'head-prepend',
        attrs: { id: '__SITE_CONTENT__', type: 'application/json' },
        children: json.replace(/</g, '\\u003c'),
      }]
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), siteContentSnapshotPlugin(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)],
    base: '/mathilde-v2/',
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
  }
})
