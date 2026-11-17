// ============================================================
// Cloudflare Worker — Meta Conversions API per mlpstudiocreativo.com
// ============================================================
// Il sito (assets/consenso.js), SOLO dopo il consenso cookie, manda qui
// gli stessi eventi del pixel con lo stesso event_id: Meta li deduplica.
// Il worker aggiunge IP e user agent, fa l'hash SHA-256 di email/telefono
// e inoltra a graph.facebook.com. Nessun dato viene salvato.
// Secret richiesto: META_CAPI_TOKEN (wrangler secret put META_CAPI_TOKEN)
// Variabile opzionale: META_TEST_CODE (codice "Test eventi" di Gestione eventi)
// ============================================================

const PIXEL_ID = '1804647940250522';
const API_VERSION = 'v21.0';
const EVENTI_AMMESSI = ['PageView', 'Lead', 'Contact'];
const ORIGINI = [
  'https://mlpstudiocreativo.com',
  'https://www.mlpstudiocreativo.com',
];

function cors(origin) {
  const ok = ORIGINI.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ORIGINI[1],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

async function sha256(v) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function pulisciTelefono(t) {
  let n = String(t).replace(/\D/g, '');
  if (!n) return '';
  if (n.startsWith('00')) n = n.slice(2);
  if (n.length <= 10 && n.startsWith('3')) n = '39' + n; // cellulare italiano senza prefisso
  return n;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (request.method !== 'POST') return new Response('ok', { headers: h });
    if (!ORIGINI.includes(origin)) return new Response('origine non ammessa', { status: 403, headers: h });
    if (!env.META_CAPI_TOKEN) return new Response('token mancante', { status: 503, headers: h });

    let b;
    try { b = await request.json(); } catch { return new Response('json', { status: 400, headers: h }); }
    if (!EVENTI_AMMESSI.includes(b.event_name) || !b.event_id) {
      return new Response('evento non valido', { status: 400, headers: h });
    }

    let url = String(b.url || '');
    try { if (!ORIGINI.includes(new URL(url).origin)) url = ORIGINI[1] + '/'; } catch { url = ORIGINI[1] + '/'; }

    const user_data = {
      client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
      client_user_agent: request.headers.get('User-Agent') || undefined,
    };
    if (b.fbp) user_data.fbp = String(b.fbp).slice(0, 200);
    if (b.fbc) user_data.fbc = String(b.fbc).slice(0, 300);
    if (b.email) user_data.em = [await sha256(String(b.email).trim().toLowerCase())];
    if (b.phone) {
      const p = pulisciTelefono(b.phone);
      if (p) user_data.ph = [await sha256(p)];
    }

    const custom_data = {};
    if (b.content_name) custom_data.content_name = String(b.content_name).slice(0, 100);
    if (b.content_category) custom_data.content_category = String(b.content_category).slice(0, 100);

    const payload = {
      data: [{
        event_name: b.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(b.event_id).slice(0, 100),
        event_source_url: url,
        action_source: 'website',
        user_data,
        custom_data,
      }],
    };
    if (env.META_TEST_CODE) payload.test_event_code = env.META_TEST_CODE;

    const r = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const testo = await r.text();
    if (!r.ok) console.log('CAPI errore', r.status, testo.slice(0, 500));
    return new Response(r.ok ? 'ok' : 'errore', { status: r.ok ? 200 : 502, headers: h });
  },
};
