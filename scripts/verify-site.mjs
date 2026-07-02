import { chromium } from 'playwright';

const BASE = 'https://paulesthor.github.io/mathilde-v2/#';
const results = [];

function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

const browser = await chromium.launch();

async function checkPage(path, expectText) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let status;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
    status = resp?.status();
  } catch (e) {
    errors.push(e.message);
  }
  await page.waitForTimeout(600);
  log(`Page ${path || '/'} charge`, !!status && status < 400, `HTTP ${status ?? 'N/A'}`);
  if (expectText) {
    const visible = await page.locator(`text=${expectText}`).first().isVisible().catch(() => false);
    log(`Page ${path || '/'} affiche "${expectText}"`, visible);
  }
  log(`Page ${path || '/'} sans erreur JS`, errors.length === 0, errors.join(' | '));
  await page.close();
}

// --- Pages publiques ---
await checkPage('/', 'Atelier Gesta');
await checkPage('/realisations');
await checkPage('/prestations');
await checkPage('/creations');
await checkPage('/dispo');
await checkPage('/about');
await checkPage('/contact');
await checkPage('/legal');
await checkPage('/success', 'Merci pour votre confiance');

// --- 404 ---
{
  const page = await browser.newPage();
  await page.goto(BASE + '/une-route-qui-nexiste-pas');
  await page.waitForTimeout(500);
  const has404 = await page.locator("text=Cette page n'existe pas").isVisible().catch(() => false);
  log('Page 404 fonctionne', has404);
  await page.close();
}

// --- Lecture publique Supabase : avis approuvés sur la Home ---
{
  const page = await browser.newPage();
  const consoleWarnings = [];
  page.on('console', (msg) => { if (msg.type() === 'warning') consoleWarnings.push(msg.text()); });
  await page.goto(BASE + '/');
  await page.waitForTimeout(1500);
  const configMissing = consoleWarnings.some((w) => w.includes('Supabase configuration is missing'));
  log('Clés Supabase bien configurées (pas de warning config manquante)', !configMissing);
  await page.close();
}

// --- Formulaire de contact (écrit une vraie ligne de test, clairement identifiée) ---
{
  const page = await browser.newPage();
  await page.goto(BASE + '/contact');
  await page.waitForTimeout(500);
  await page.fill('#firstName', 'TEST-VERIF-AUTO');
  await page.fill('#lastName', 'A-SUPPRIMER');
  await page.fill('#email', 'test-verification-automatique@example.com');
  await page.fill('#message', 'Ceci est un test automatisé de vérification post-déploiement. Merci de supprimer cette entrée.');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const success = await page.locator('text=Demande envoyée').isVisible().catch(() => false);
  log('Formulaire de contact fonctionne (Edge Function send-contact-email)', success);
  await page.close();
}

// --- Soumission d'avis (écrit une vraie ligne de test, clairement identifiée) ---
{
  const page = await browser.newPage();
  await page.goto(BASE + '/');
  await page.waitForTimeout(800);
  await page.click("text=Laisser un avis à l'Atelier");
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="Ex: Sophie M."]', 'TEST-VERIF-AUTO A-SUPPRIMER');
  await page.fill('textarea[placeholder*="Partagez votre expérience"]', 'Ceci est un test automatisé de vérification post-déploiement (submit-review). Merci de supprimer.');
  await page.click('button[type="submit"]:has-text("Envoyer")');
  await page.waitForTimeout(3000);
  const success = await page.locator('text=Merci ! Votre avis a été soumis').isVisible().catch(() => false);
  log("Soumission d'avis fonctionne (Edge Function submit-review)", success);
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== RESUME: ${results.length - failed.length}/${results.length} OK ===`);
if (failed.length) {
  console.log('Echecs:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
