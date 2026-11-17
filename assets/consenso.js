/*
 * MLP Studio Creativo — consenso cookie + tracciamento (Meta Pixel, GA4 opzionale)
 * Niente script di terze parti finché l'utente non clicca "Accetta".
 * Scelta salvata 6 mesi (linee guida Garante 2021), poi il banner ricompare.
 * Riapertura preferenze: qualsiasi elemento con [data-cookie-settings].
 * Eventi: PageView (tutte le pagine), Contact (click su mailto), Lead (form inviato),
 * oppure evento forzato via <script src=".../consenso.js" data-event="Lead">.
 */
(function () {
  'use strict';

  var PIXEL_ID = '1804647940250522';
  var GA4_ID = ''; // es. 'G-XXXXXXXXXX' — vuoto = GA4 non caricato
  var KEY = 'mlp_consenso_v1';
  var DURATA_MS = 1000 * 60 * 60 * 24 * 182;

  var self = document.currentScript;
  var eventoPagina = self && self.getAttribute('data-event');
  var coda = [];
  var attivo = false;

  function leggi() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && v.t && Date.now() - v.t < DURATA_MS) return v.scelta;
    } catch (e) {}
    return null;
  }
  function salva(scelta) {
    try { localStorage.setItem(KEY, JSON.stringify({ scelta: scelta, t: Date.now() })); } catch (e) {}
  }
  function uid() {
    return 'mlp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- tracciamento ---------- */
  function caricaPixel() {
    /* snippet ufficiale Meta */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function caricaGA4() {
    if (!GA4_ID) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { anonymize_ip: true });
  }
  function caricaOverloop() {
    var f = document.createElement('iframe');
    f.src = 'https://app.overloop.ai/companies/4e6c0864-3de1-4f6a-a095-13d6051f4e53/tracker?u=' +
      encodeURIComponent(location.href) + '&t=' + encodeURI(document.title);
    f.width = 0; f.height = 0; f.style.display = 'none'; f.setAttribute('aria-hidden', 'true');
    document.body.appendChild(f);
  }

  function invia(nome, dati) {
    var id = uid();
    if (window.fbq) window.fbq('track', nome, dati || {}, { eventID: id });
    if (window.gtag) {
      var ga = { Lead: 'generate_lead', Contact: 'contact' }[nome] || nome;
      window.gtag('event', ga, dati || {});
    }
  }

  /* API pubblica: window.mlpTrack('Lead', {content_name: 'form contatti'}) */
  window.mlpTrack = function (nome, dati) {
    if (attivo) invia(nome, dati); else coda.push([nome, dati]);
  };

  function attiva() {
    if (attivo) return;
    attivo = true;
    caricaPixel();
    caricaGA4();
    caricaOverloop();
    if (eventoPagina) invia(eventoPagina, { content_name: location.pathname });
    while (coda.length) { var c = coda.shift(); invia(c[0], c[1]); }
  }

  /* click su mail = Contact (registrato anche prima del consenso, inviato solo se accetta) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"], a[href*="wa.me/"], a[href*="api.whatsapp.com"]');
    if (!a) return;
    var canale = /^mailto:/.test(a.getAttribute('href')) ? 'email' : 'whatsapp';
    window.mlpTrack('Contact', { content_name: canale, content_category: location.pathname });
  }, true);

  /* ---------- banner ---------- */
  var CSS =
    '#mlp-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9500;background:#0a0a0a;color:#fff;padding:18px 22px;' +
    'display:flex;align-items:center;gap:24px;flex-wrap:wrap;font-family:"Nunito Sans",Roboto,sans-serif;font-weight:300;' +
    'font-size:13px;line-height:1.55;max-width:920px;margin:0 auto;box-shadow:0 12px 48px rgba(0,0,0,.22);' +
    'opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}' +
    '#mlp-cookie.is-on{opacity:1;transform:none}' +
    '#mlp-cookie p{flex:1;min-width:240px;margin:0;color:rgba(255,255,255,.82)}' +
    '#mlp-cookie a{color:#fff;text-decoration:underline;text-underline-offset:3px}' +
    '#mlp-cookie .b{display:flex;gap:10px}' +
    '#mlp-cookie button{border:1px solid #fff;cursor:pointer;padding:12px 24px;font-size:11px;letter-spacing:.3em;' +
    'text-transform:uppercase;font-family:inherit;font-weight:400;background:#fff;color:#0a0a0a;transition:letter-spacing .3s ease}' +
    '#mlp-cookie button:hover,#mlp-cookie button:focus-visible{letter-spacing:.42em}' +
    '@media (max-width:640px){#mlp-cookie{flex-direction:column;align-items:stretch;gap:14px;padding:16px 18px;font-size:12px}' +
    '#mlp-cookie .b button{flex:1}}' +
    '@media (prefers-reduced-motion:reduce){#mlp-cookie{transition:opacity .2s ease;transform:none}}';

  function chiudi() { var b = document.getElementById('mlp-cookie'); if (b) b.remove(); }

  function mostraBanner() {
    if (document.getElementById('mlp-cookie')) return;
    if (!document.getElementById('mlp-cookie-css')) {
      var st = document.createElement('style'); st.id = 'mlp-cookie-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    var d = document.createElement('div');
    d.id = 'mlp-cookie';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-live', 'polite');
    d.setAttribute('aria-label', 'Preferenze cookie');
    d.innerHTML =
      '<p>Usiamo cookie tecnici per far funzionare il sito e, solo se accetti, cookie di misurazione e marketing ' +
      '(Meta Pixel) per capire come arrivano le visite e migliorare le nostre campagne. Puoi cambiare idea quando vuoi ' +
      'dal link Cookie in fondo alla pagina. <a href="/privacy.html">Privacy Policy</a></p>' +
      '<div class="b"><button type="button" data-c="no">Rifiuta</button><button type="button" data-c="si">Accetta</button></div>';
    d.addEventListener('click', function (e) {
      var c = e.target.getAttribute && e.target.getAttribute('data-c');
      if (!c) return;
      var prima = leggi();
      salva(c);
      chiudi();
      try { document.dispatchEvent(new CustomEvent('mlp:consenso', { detail: c })); } catch (er) {}
      if (c === 'si') attiva();
      else if (prima === 'si' || attivo) location.reload(); // revoca: ricarica senza tracker
    });
    document.body.appendChild(d);
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('is-on'); }); });
  }

  window.mlpConsenso = { apri: mostraBanner, stato: leggi };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); mostraBanner(); }
  });

  function avvio() {
    var s = leggi();
    if (s === 'si') attiva();
    else if (s === null) {
      // sulla home aspetta la fine dell'intro animata
      var intro = document.querySelector('.intro, .intro-curtain');
      setTimeout(mostraBanner, intro ? 5200 : 200);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio);
  else avvio();
})();
