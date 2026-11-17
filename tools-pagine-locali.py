"""Genera le pagine locali del sito MLP partendo da services.html (stessa testata, stile e footer)."""
import html, json, re, sys
from pathlib import Path

SITO = Path(sys.argv[1])
BASE = "https://www.mlpstudiocreativo.com/"
src = (SITO / "services.html").read_text()

CSS = """
  .loc-sez{padding:72px 48px;border-top:1px solid var(--line,#e8e8e8)}
  .loc-sez h2{font-family:'Avenir Light','Avenir Next','Avenir','Nunito Sans',sans-serif;font-weight:300;font-size:clamp(30px,4vw,48px);line-height:1;letter-spacing:-.02em;margin:0 0 36px}
  .loc-sez h2 .italic{font-family:'Nunito Sans',serif;font-style:italic;font-weight:200}
  .loc-casi{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line,#e8e8e8);border:1px solid var(--line,#e8e8e8)}
  .loc-caso{display:flex;flex-direction:column;background:var(--paper,#fff);color:inherit;text-decoration:none;transition:background .3s}
  .loc-caso:hover{background:var(--paper-2,#f3f3f3)}
  .loc-caso .img{aspect-ratio:4/3;background-size:cover;background-position:center;filter:grayscale(1);transition:filter .4s}
  .loc-caso:hover .img{filter:none}
  .loc-caso .txt{padding:20px 22px 24px}
  .loc-caso .zona{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted,#7a7a7a)}
  .loc-caso .nome{font-family:'Avenir Light','Avenir Next','Avenir',sans-serif;font-size:20px;margin:6px 0 6px}
  .loc-caso .cosa{font-size:14px;color:var(--muted,#7a7a7a);line-height:1.5}
  .loc-voce{max-width:820px}
  .loc-voce .quote{font-family:'Avenir Light','Avenir Next','Avenir',sans-serif;font-size:clamp(22px,2.6vw,32px);line-height:1.3;margin:0 0 14px}
  .loc-voce .chi{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted,#7a7a7a)}
  .loc-faq{max-width:860px}
  .loc-faq details{border-bottom:1px solid var(--line,#e8e8e8);padding:18px 0}
  .loc-faq summary{cursor:pointer;font-size:17px;list-style:none}
  .loc-faq summary::after{content:'+';float:right;color:var(--muted,#7a7a7a)}
  .loc-faq details[open] summary::after{content:'–'}
  .loc-faq p{color:var(--muted,#7a7a7a);line-height:1.6;margin:12px 0 0}
  .loc-zone{font-size:14px;line-height:1.8;color:var(--muted,#7a7a7a);max-width:820px}
  @media (max-width:900px){.loc-sez{padding:56px 20px}.loc-casi{grid-template-columns:1fr}}
"""


def sezione_servizio(n, kicker, titolo, testo, testo2, voci, img):
    return f"""
<article class="svc-ed reveal">
  <div class="svc-num">{n:02d}</div>
  <div class="svc-body">
    <div class="svc-kicker">— {kicker}</div>
    <h2 class="svc-title">{titolo}</h2>
    <p class="svc-desc">{testo}</p>
    <p class="svc-desc-muted">{testo2}</p>
    <ul class="svc-list">{''.join(f'<li>{v}</li>' for v in voci)}</ul>
  </div>
  <div class="svc-media" style="background-image:url('{img}')"></div>
</article>
"""


def pagina(p):
    s = src
    t, d, url = html.escape(p["title"], quote=False), html.escape(p["desc"]), BASE + p["file"]
    s = re.sub(r"<title>[^<]*</title>", f"<title>{t}</title>", s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + d, s, count=1)
    s = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, s)
    for k in ("og:title", "twitter:title"):
        s = re.sub(rf'(<meta (?:property|name)="{k}" content=")[^"]*', lambda m: m.group(1) + html.escape(p["title"]), s)
    for k in ("og:description", "twitter:description"):
        s = re.sub(rf'(<meta (?:property|name)="{k}" content=")[^"]*', lambda m: m.group(1) + d, s)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#pagina", "url": url, "name": p["title"], "description": p["desc"],
         "isPartOf": {"@id": BASE + "#website"}, "about": {"@id": BASE + "#organization"}, "inLanguage": "it-IT"},
        {"@type": "Service", "name": p["servizio"], "provider": {"@id": BASE + "#organization"},
         "areaServed": [{"@type": "City", "name": c} for c in p["aree"]], "url": url},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE},
            {"@type": "ListItem", "position": 2, "name": p["breadcrumb"], "item": url}]},
    ]}
    s = re.sub(r'<script type="application/ld\+json">.*?</script>',
               '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=1) + "\n</script>", s, count=1, flags=re.S)
    s = s.replace("</style>", CSS + "</style>", 1)
    s = s.replace('<div class="meta">Servizi · Vol. II</div>', f'<div class="meta">{p["breadcrumb"]}</div>', 1)

    corpo = f"""<!-- INTRO -->
<section class="svc-intro">
  <div>
    <div class="kicker">— {p['kicker']}</div>
    <h1><span class="h1-seo">{p['h1_seo']}</span>{p['h1']}</h1>
  </div>
  <p class="lead">{p['lead']}</p>
</section>
"""
    corpo += "".join(sezione_servizio(i + 1, *x) for i, x in enumerate(p["servizi"]))
    corpo += f"""
<section class="loc-sez reveal">
  <h2>{p['titolo_casi']}</h2>
  <div class="loc-casi">
{''.join(f'''    <a class="loc-caso" href="projects/{c[0]}.html"><div class="img" style="background-image:url('projects/img/{c[1]}')"></div><div class="txt"><div class="zona">{c[2]}</div><div class="nome">{c[3]}</div><div class="cosa">{c[4]}</div></div></a>
''' for c in p['casi'])}  </div>
</section>

<section class="loc-sez reveal">
  <div class="loc-voce">
    <p class="quote">“{p['voce'][0]}”</p>
    <div class="chi">{p['voce'][1]} · <a href="recensioni.html" style="color:inherit">video recensioni</a></div>
  </div>
</section>

<section class="loc-sez reveal">
  <h2>Dove <span class="italic">lavoriamo</span></h2>
  <p class="loc-zone">{p['zone']}</p>
</section>

<section class="loc-sez reveal">
  <h2>Domande <span class="italic">frequenti</span></h2>
  <div class="loc-faq">
{''.join(f'    <details><summary>{q}</summary><p>{a}</p></details>\n' for q, a in p['faq'])}  </div>
</section>

"""
    a = s.index("<!-- INTRO -->")
    b = s.index("<!-- CTA -->")
    s = s[:a] + corpo + s[b:]
    s = s.replace('<a class="btn" href="index.html#contatti">Prenota una call →</a>',
                  '<a class="btn" href="call-strategica/">Prenota una call →</a>', 1)
    (SITO / p["file"]).write_text(s)
    print("scritta", p["file"])


SAN_DONA = {
    "file": "agenzia-comunicazione-san-dona-di-piave.html",
    "title": "Agenzia di comunicazione a San Donà di Piave — MLP Studio",
    "desc": "MLP Studio Creativo è l'agenzia di comunicazione di San Donà di Piave: social, reel, siti, video ed eventi per aziende del Veneto Orientale.",
    "servizio": "Agenzia di comunicazione a San Donà di Piave",
    "breadcrumb": "San Donà di Piave",
    "aree": ["San Donà di Piave", "Musile di Piave", "Noventa di Piave", "Ceggia", "Eraclea", "Jesolo", "Portogruaro"],
    "kicker": "San Donà di Piave · Veneto Orientale",
    "h1_seo": "Agenzia di comunicazione a San Donà di Piave",
    "h1": 'Comunicazione, <span class="italic">da qui.</span>',
    "lead": "MLP Studio Creativo nasce a San Donà di Piave e qui ha la sua squadra. Seguiamo aziende del Veneto Orientale che vogliono farsi riconoscere: social e reel girati nella loro sede, siti web, video, eventi e fiere. Prima la strategia, poi i contenuti: ogni post ha un motivo per esistere.",
    "servizi": [
        ("Social", 'Social media <span class="italic">e reel</span>',
         "Strategia, piano editoriale, shooting mensile nella sede del cliente, reel e pubblicazione. Lavoriamo sui pilastri del brand, non sul post del giorno.",
         "A San Donà seguiamo così un hotel ristorante, una pizzeria al pezzo, uno studio di fisioterapia e un'agenzia assicurativa: settori diversi, stesso metodo.",
         ["Strategia e pilastri", "Shooting in sede", "Reel e caroselli", "Sponsorizzate Meta"], "projects/img/tortuga/tortuga-caso-01.jpg"),
        ("Siti", 'Siti web <span class="italic">e SEO locale</span>',
         "Siti chiari, veloci e scritti per farsi trovare da chi cerca nella tua zona: struttura, testi, foto e messa online.",
         "Per Optimove e Galesso & Partners il sito lavora insieme ai social: stessi volti, stesso tono, un solo racconto.",
         ["Sito vetrina", "Testi e foto", "SEO locale", "Google Business"], "projects/img/optimove/optimove-caso-01.jpg"),
        ("Video", 'Video <span class="italic">e produzione</span>',
         "Spot, brand video e contenuti per aziende, dalla scaletta al montaggio. Con MLP Production giriamo anche fuori provincia.",
         'Il lavoro di produzione è raccontato nella pagina <a href="production.html" style="color:inherit">MLP Production</a>.',
         ["Brand video", "Corporate", "Reel per aziende", "Riprese con drone"], "projects/img/de-piccoli/de-piccoli-caso-01.jpg"),
        ("Eventi", 'Eventi <span class="italic">e fiere</span>',
         "Inaugurazioni, lanci, serate e stand in fiera: regia, immagine coordinata, video e contenuti da usare anche dopo.",
         'Un esempio: <a href="projects/made-solutions-glasstec.html" style="color:inherit">MaDe Solutions a Glasstec 2026</a>, cinque aziende in un unico stand.',
         ["Regia eventi", "Stand e fiere", "Immagine coordinata", "Video dell'evento"], "projects/img/forte48/forte48-01.jpg"),
    ],
    "titolo_casi": 'Casi studio <span class="italic">a San Donà</span> e dintorni',
    "casi": [
        ("forte48", "forte48/forte48-02.jpg", "San Donà di Piave", "Hotel Ristorante Forte del 48", "Social, shooting, grafica di eventi e menù"),
        ("optimove", "optimove/optimove-caso-02.jpg", "San Donà di Piave", "Optimove Fisioterapia", "Reel, sito e sponsorizzate"),
        ("galesso", "galesso/galesso-caso-02.jpg", "San Donà di Piave", "Galesso & Partners", "Social, caroselli, sito e identità visiva"),
        ("tortuga", "tortuga/tortuga-caso-02.jpg", "San Donà di Piave", "Tortuga · Pizza al Pezzo", "Shooting mensile e reel di tendenza"),
        ("de-piccoli", "de-piccoli/de-piccoli-caso-02.jpg", "San Donà di Piave e Ceggia", "Immobiliare De Piccoli", "Personal brand, video e drone"),
        ("ottica-borin", "ottica-borin/ottica-borin-caso-02.jpg", "Jesolo, San Donà, Mestre", "Ottica Borin", "Tre insegne, una regia"),
    ],
    "voce": ("Sono riusciti a cogliere l'essenza della nostra attività e sono entrati molto in sintonia con noi. Lo consiglierei veramente a chiunque.", "Prisca, Hotel Forte del 48"),
    "zone": "Lo studio è a San Donà di Piave (Venezia). Lavoriamo in tutto il Veneto Orientale: Musile di Piave, Noventa di Piave, Ceggia, Eraclea, Jesolo, Caorle, Portogruaro, Mestre e Venezia, fino a Treviso e al Friuli. Per shooting e riprese veniamo noi nella tua sede.",
    "faq": [
        ("Lavorate solo con aziende di San Donà di Piave?", "No. Lo studio è a San Donà, ma seguiamo clienti in tutto il Veneto e in Friuli. Per chi è in zona è più semplice organizzare shooting frequenti e incontri di persona."),
        ("Venite voi a fare foto e video?", "Sì. Gli shooting si fanno nella sede del cliente: il ristorante, il negozio, l'ufficio, il cantiere. È lì che si vede il lavoro vero."),
        ("Quanto costa?", "Ogni progetto è diverso, quindi lo valutiamo insieme in una call conoscitiva gratuita. Dopo la call ricevi una proposta scritta."),
        ("Fate anche siti web?", "Sì: siti vetrina e siti per attività locali, pensati per farsi trovare su Google nella tua zona e per lavorare insieme ai social."),
    ],
}

JESOLO = {
    "file": "social-media-marketing-jesolo.html",
    "title": "Agenzia social media marketing a Jesolo — MLP Studio",
    "desc": "Social, reel e shooting per attività di Jesolo e del litorale: ristoranti, negozi, hotel e servizi. Casi studio con Al Baretto, Piave Pesca e Venus.",
    "servizio": "Social media marketing a Jesolo",
    "breadcrumb": "Jesolo",
    "aree": ["Jesolo", "Cavallino-Treporti", "Eraclea", "Caorle", "San Donà di Piave"],
    "kicker": "Jesolo · litorale veneto",
    "h1_seo": "Agenzia di social media marketing a Jesolo",
    "h1": 'Il litorale, <span class="italic">ogni giorno.</span>',
    "lead": "A Jesolo la stagione si gioca in pochi mesi e i clienti arrivano anche da Instagram e TikTok. Seguiamo bar, ristoranti, negozi e aziende di servizi del litorale con un piano che parte prima dell'estate e non si ferma a settembre: shooting sul posto, reel, sponsorizzate e, quando serve, il sito.",
    "servizi": [
        ("Reel", 'Reel <span class="italic">e shooting sul posto</span>',
         "Giriamo dove lavori: al bancone, in sala, in negozio, in cantiere. Persone vere e lavoro vero, non immagini di repertorio.",
         "Per Piave Pesca sono più di cento reel girati al banco del pesce; per Venus i cantieri delle piscine raccontati da chi le costruisce.",
         ["Shooting mensile", "Reel e TikTok", "Personal brand del titolare", "Caroselli e storie"], "projects/img/piave-pesca/piave-01.jpg"),
        ("Stagione", 'Un piano <span class="italic">per la stagione</span>',
         "Prima della stagione si prepara il racconto, d'estate si pubblica con costanza, d'inverno si lavora sui clienti del posto e sulla prossima apertura.",
         "Il calendario segue gli eventi del litorale e i ritmi della tua attività.",
         ["Piano editoriale", "Eventi e aperture", "Fuori stagione", "Report mensile"], "projects/img/al-baretto/al-baretto-caso-01.jpg"),
        ("Ads", 'Sponsorizzate <span class="italic">locali</span>',
         "Campagne Meta pensate per chi è già in zona o sta per arrivarci: residenti, turisti, chi cerca dove mangiare o cosa comprare.",
         "Budget, pubblico e creatività si decidono insieme e si controllano con i numeri.",
         ["Campagne Meta", "Pubblico locale e turisti", "Test delle creatività", "Report"], "projects/img/venus/venus-caso-01.jpg"),
        ("Siti", 'Siti <span class="italic">ed e-commerce</span>',
         "Quando i social non bastano: un sito chiaro o un e-commerce che continua a vendere anche fuori stagione.",
         'Per <a href="projects/internoventi.html" style="color:inherit">Internoventi</a>, negozio di abbigliamento di Jesolo Lido, abbiamo fatto lavorare insieme social, e-commerce e sponsorizzate.',
         ["Sito vetrina", "E-commerce", "SEO locale", "Google Business"], "projects/img/internoventi/internoventi-caso-01.jpg"),
    ],
    "titolo_casi": 'Casi studio <span class="italic">a Jesolo</span> e sul litorale',
    "casi": [
        ("al-baretto", "al-baretto/al-baretto-caso-02.jpg", "Jesolo Lido", "Al Baretto", "Social dalla colazione all'aperitivo"),
        ("internoventi", "internoventi/internoventi-caso-02.jpg", "Jesolo Lido", "Internoventi", "Social, e-commerce e sponsorizzate"),
        ("piave-pesca", "piave-pesca/piave-02.jpg", "Jesolo", "Piave Pesca", "Il pesce spiegato dal banco, in reel"),
        ("venus", "venus/venus-caso-02.jpg", "Jesolo e litorale", "Piscine Venus", "Cantieri e persone vere"),
        ("ottica-borin", "ottica-borin/ottica-borin-caso-01.jpg", "Jesolo, San Donà, Mestre", "Ottica Borin", "Tre insegne, una regia"),
    ],
    "voce": ("Diversi video sono andati virali. Il giorno dello shooting guardiamo i contenuti assieme e mi fanno dire le cose a parole mie.", "Piscine Venus, Jesolo"),
    "zone": "Seguiamo attività a Jesolo Lido e Jesolo Paese, Cavallino-Treporti, Eraclea Mare e Caorle. Lo studio è a San Donà di Piave, a pochi minuti dal litorale: per shooting e riprese veniamo noi.",
    "faq": [
        ("Lavorate anche con attività stagionali?", "Sì, la maggior parte dei nostri clienti sul litorale lavora d'estate. Il piano tiene conto della stagione: preparazione in primavera, pubblicazione costante d'estate, clienti locali d'inverno."),
        ("Quanti shooting fate?", "Di solito uno al mese, nella tua attività. In alta stagione si può fare di più, da valutare insieme."),
        ("Gestite anche le sponsorizzate?", "Sì, campagne Meta su Instagram e Facebook per pubblico locale e turisti, con controllo dei risultati."),
        ("Quanto costa?", "Ogni attività è diversa, quindi lo valutiamo in una call conoscitiva gratuita. Dopo la call ricevi una proposta scritta."),
    ],
}

for p in (SAN_DONA, JESOLO):
    pagina(p)
