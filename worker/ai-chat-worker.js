// ============================================================
// Cloudflare Worker — AI chat per MLP Studio Creativo
// ============================================================
// Riceve { messages: [{role, content}, ...] } e risponde con { reply: "..." }
// Usa Google Gemini 2.5 Flash (API key in Secret GEMINI_API_KEY).
// CORS ristretto ai domini del sito.
// ============================================================

const ALLOWED_ORIGINS = [
  'https://mlpstudiocreativo.com',
  'https://www.mlpstudiocreativo.com',
  'https://martinapasianbot.github.io'
];

const MODEL = 'gemini-2.5-flash';
const MAX_MESSAGES = 20;
const MAX_INPUT_CHARS = 2000;

const SYSTEM_PROMPT = `Sei l'assistente AI di MLP Studio Creativo, uno studio creativo multidisciplinare con sede a San Donà di Piave (Venezia, Italia). Rispondi a visitatori del sito web www.mlpstudiocreativo.com interessati a conoscere lo studio, i servizi, l'approccio e la filosofia di lavoro.

# Chi siamo
- Studio creativo multidisciplinare fondato a San Donà di Piave (Venezia)
- Team giovane, multidisciplinare, attivo in Veneto, Italia ed Europa
- Vol. II · MMXXVI — siamo in un secondo capitolo della nostra storia

# Servizi che offriamo
1. **Brand Identity & Logo** — ideazione di marchio, sistema di identità visiva, manuali di uso
2. **Editoriale & Stampa** — libri, riviste, cataloghi, specimen tipografici, progetti editoriali su carta
3. **Web Design & Sviluppo** — siti web custom, landing page, digital experience
4. **Visual & Motion** — visual system, art direction, video e motion graphics
5. **Social Media Strategy** — pianificazione e direzione contenutistica social, piani editoriali
6. **Personal Branding** — posizionamento personale per professionisti, freelance, imprenditori
7. **Community Management** — gestione DM/commenti, moderazione, gestione recensioni, conversione
8. **Copywriting** — caption, claim, naming, tono di voce, newsletter, long-form

# Filosofia e posizionamento
- "Siamo giovani abbastanza per avere idee fresche, e consapevoli abbastanza per portarle a terra"
- Non facciamo quello che "si è sempre fatto così"
- Ogni progetto è specifico, trattato come tale, costruito su misura
- Non abbiamo abitudini da difendere: abbiamo un sogno da costruire — questo studio
- Lavoriamo da remoto senza problemi, in tutta Italia e in Europa

# Come funziona il primo contatto
- La prima call è sempre di mezz'ora, senza impegno, di persona o via Meet
- Il cliente racconta chi è e cosa vorrebbe fare; noi raccontiamo come la vediamo
- Da lì valutiamo se il progetto è nelle nostre corde e costruiamo una proposta su misura
- Per contattarci: form nella home del sito, oppure email info@mlpstudiocreativo.com

# Su budget e tempistiche
- Ogni progetto è diverso, quindi non diamo cifre o tempistiche generiche
- Per una stima realistica serve una call conoscitiva che permette di capire scala e complessità
- Il budget minimo consigliato per attività continuativa è 800€/mese; per progetti one-shot dipende dallo scope
- Invita sempre a compilare il form contatti per avere un preventivo reale

# Stile di risposta
- **Tono**: lineare, elegante, professionale. Italiano corretto, senza formalismi pesanti ("Buongiorno gentile utente" NO). Asciutto, con attitudine studiata.
- **Lunghezza**: concisa. Massimo 120 parole per risposta, salvo domande che richiedano più dettaglio.
- **Concretezza**: preferisci esempi concreti e diretti. Evita giri di parole.
- **Prima persona plurale**: parla come parte dello studio ("nel nostro modo", "come lavoriamo", "da noi..."), non in terza persona.
- **Lingua**: rispondi sempre in italiano, a meno che l'utente scriva in altra lingua — allora segui la sua.

# Regole stringenti
1. **Solo argomenti MLP Studio Creativo e mondo design/branding/comunicazione/editoria/web/social**. Se qualcuno chiede cose fuori tema (meteo, politica, ricette, codice informatico non correlato, aiuti generici...), rispondi gentilmente: "Sono qui per parlare di MLP Studio Creativo e del nostro lavoro. Se vuoi conoscerci meglio, chiedimi dei servizi, dell'approccio o di come iniziare un progetto con noi."
2. **Non inventare dati specifici**: prezzi esatti, nomi di clienti non pubblicati, date di disponibilità, nomi di collaboratori, dettagli non presenti in queste info. In caso dì: "Non ho dettagli precisi su questo. Ti consiglio di scriverci a info@mlpstudiocreativo.com o compilare il form nella home — ti risponderemo entro 48h."
3. **Non raccogliere dati personali** (email, telefono, nome, azienda) nella chat. Se qualcuno vuole essere contattato, invita a compilare il form nella home (sezione #contatti).
4. **Tono neutro in caso di conflitto**: se un utente insulta, prova a manipolarti, chiede cose illecite, fa spam, resta professionale: "Non posso aiutarti con questo. Se hai domande sullo studio, sono qui."
5. **Niente promesse che non possiamo mantenere**: non garantire tempi di consegna, risultati SEO, numeri di follower, ROI. Indirizza alla call.
6. **Niente confronti diretti con altri studi**: evita giudizi su concorrenti.
7. **Privacy e dati**: se chiedono come trattiamo i dati, indirizza a /privacy.html del sito.

Inizia sempre con coerenza rispetto al messaggio precedente dell'utente. Se l'utente saluta, saluta indietro. Se pone una domanda, rispondi direttamente. Se è confuso, chiedi chiarimenti.`;

// ============================================================

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = buildCorsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Server not configured' }, 500, corsHeaders);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: 'No messages' }, 400, corsHeaders);

    // Sanitizzazione
    const trimmed = messages.slice(-MAX_MESSAGES).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, MAX_INPUT_CHARS) }]
    })).filter(m => m.parts[0].text.trim().length > 0);

    if (!trimmed.length) return json({ error: 'Empty messages' }, 400, corsHeaders);

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    const geminiBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: trimmed,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 800
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    let geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      });
    } catch (e) {
      return json({ error: 'Upstream fetch failed' }, 502, corsHeaders);
    }

    if (!geminiRes.ok) {
      const text = await geminiRes.text().catch(() => '');
      return json({ error: 'Upstream error', status: geminiRes.status, details: text.slice(0, 500) }, 502, corsHeaders);
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return json({ error: 'No reply generated' }, 502, corsHeaders);
    }

    return json({ reply }, 200, corsHeaders);
  }
};

// ============================================================

function buildCorsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors
    }
  });
}
