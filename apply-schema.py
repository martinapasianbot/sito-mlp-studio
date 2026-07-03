#!/usr/bin/env python3
"""
Applica schema JSON-LD, Open Graph, Twitter Card, canonical a tutte le pagine
del sito mlpstudiocreativo.com.

Uso: python3 apply-schema.py
"""

import re
from pathlib import Path
from html import unescape

ROOT = Path(__file__).parent
SITE_URL = "https://www.mlpstudiocreativo.com"

# Anagrafica MLP
ORG = {
    "name": "MLP Studio Creativo",
    "email": "mlpstudiocreativo@gmail.com",
    "street": "Via Vespucci 21",
    "city": "San Donà di Piave",
    "region": "Venezia",
    "postal": "30027",
    "country": "IT",
    "lat": "45.6376",   # verificare esatte
    "lon": "12.5695",   # verificare esatte
    "instagram": "https://www.instagram.com/mlpstudiocreativo/",
    "slogan": "Idee & forma.",
}

# --------- Blocchi schema riutilizzabili ---------

ORGANIZATION_NODE = f'''{{
      "@type": "ProfessionalService",
      "@id": "{SITE_URL}/#organization",
      "name": "{ORG['name']}",
      "alternateName": "MLP",
      "description": "Studio creativo multidisciplinare con sede a San Donà di Piave (Venezia). Brand identity, web design, editoriale, visual, motion, social media strategy, personal branding, produzione video, eventi e wedding per brand esigenti in Italia ed Europa.",
      "url": "{SITE_URL}/",
      "logo": {{"@type": "ImageObject", "url": "{SITE_URL}/logo.svg"}},
      "image": "{SITE_URL}/logo.svg",
      "email": "{ORG['email']}",
      "founder": {{
        "@type": "Person",
        "name": "Martina Pasian",
        "jobTitle": "Fondatrice e Direttrice Creativa"
      }},
      "address": {{
        "@type": "PostalAddress",
        "streetAddress": "{ORG['street']}",
        "addressLocality": "{ORG['city']}",
        "addressRegion": "{ORG['region']}",
        "postalCode": "{ORG['postal']}",
        "addressCountry": "{ORG['country']}"
      }},
      "geo": {{
        "@type": "GeoCoordinates",
        "latitude": "{ORG['lat']}",
        "longitude": "{ORG['lon']}"
      }},
      "openingHoursSpecification": [{{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }}],
      "areaServed": [
        {{"@type": "Country", "name": "Italia"}},
        {{"@type": "Place", "name": "Veneto"}},
        {{"@type": "Place", "name": "Friuli-Venezia Giulia"}},
        {{"@type": "Place", "name": "Europa"}}
      ],
      "priceRange": "€€€",
      "knowsAbout": [
        "Brand Identity","Web Design","Editoriale e Print","Visual e Motion Design",
        "Social Media Strategy","Personal Branding","Community Management",
        "Copywriting","Produzione Video","Organizzazione Eventi","Wedding Communication"
      ],
      "slogan": "{ORG['slogan']}",
      "sameAs": ["{ORG['instagram']}"]
    }}'''

WEBSITE_NODE = f'''{{
      "@type": "WebSite",
      "@id": "{SITE_URL}/#website",
      "url": "{SITE_URL}/",
      "name": "MLP Studio Creativo",
      "description": "Studio Creativo Multidisciplinare — San Donà di Piave",
      "publisher": {{"@id": "{SITE_URL}/#organization"}},
      "inLanguage": "it-IT"
    }}'''


def og_block(page_url, title, description, og_image, og_type="website"):
    """Genera meta OG + Twitter + canonical per una pagina."""
    return f'''<link rel="canonical" href="{page_url}" />
<meta property="og:type" content="{og_type}" />
<meta property="og:url" content="{page_url}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{og_image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="it_IT" />
<meta property="og:site_name" content="MLP Studio Creativo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{og_image}" />'''


def homepage_schema():
    """Homepage: Organization + WebSite + WebPage."""
    webpage = f'''{{
      "@type": "WebPage",
      "@id": "{SITE_URL}/#webpage",
      "url": "{SITE_URL}/",
      "name": "MLP Studio Creativo — Studio Creativo Multidisciplinare · San Donà di Piave",
      "description": "MLP Studio Creativo. Branding, web design, editoriale e visual per brand esigenti. Sede a San Donà di Piave, Italia ed Europa.",
      "isPartOf": {{"@id": "{SITE_URL}/#website"}},
      "about": {{"@id": "{SITE_URL}/#organization"}},
      "inLanguage": "it-IT"
    }}'''
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {ORGANIZATION_NODE},
    {WEBSITE_NODE},
    {webpage}
  ]
}}
</script>
'''


def services_schema():
    """services.html — WebPage + Breadcrumb + ItemList servizi."""
    services = [
        ("Brand Identity", "Creazione di identità visive coerenti e memorabili: logo, sistema visivo, linee guida di brand."),
        ("Web & Digital", "Progettazione e sviluppo di siti web, e-commerce e piattaforme digitali su misura."),
        ("Editoriale & Print", "Progetti editoriali, libri, riviste, cataloghi, materiali stampati con attenzione al dettaglio tipografico."),
        ("Visual & Motion", "Direzione visiva, illustrazione, motion graphics e animazioni per brand."),
        ("Social Media Strategy", "Strategia e gestione dei canali social per brand esigenti in Italia ed Europa."),
        ("Personal Branding", "Costruzione del posizionamento personale per founder, professionisti e imprenditori."),
        ("Community Management", "Gestione delle community online e cura del dialogo con l'audience del brand."),
        ("Copywriting", "Scrittura di copy per brand, siti, campagne, editoriali e canali social."),
        ("MLP Production", "Casa di produzione: riprese video, spot, contenuti short-form, direzione della fotografia."),
        ("MLP Eventi", "Progettazione e coordinamento di eventi corporate, culturali e di brand."),
        ("MLP Wedding", "Comunicazione e progettazione per matrimoni e cerimonie."),
    ]
    items = []
    for i, (name, desc) in enumerate(services, start=1):
        items.append(f'''{{
          "@type": "Service",
          "position": {i},
          "name": "{name}",
          "description": "{desc}",
          "provider": {{"@id": "{SITE_URL}/#organization"}}
        }}''')
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "WebPage",
      "@id": "{SITE_URL}/services.html#webpage",
      "url": "{SITE_URL}/services.html",
      "name": "Servizi — MLP Studio Creativo",
      "description": "Le discipline di MLP Studio Creativo: Brand Identity, Web & Digital, Editoriale & Print, Visual & Motion, Social Media Strategy, Personal Branding, Community Management, Copywriting, MLP Production, MLP Eventi e MLP Wedding.",
      "isPartOf": {{"@id": "{SITE_URL}/#website"}},
      "about": {{"@id": "{SITE_URL}/#organization"}},
      "inLanguage": "it-IT",
      "breadcrumb": {{"@id": "{SITE_URL}/services.html#breadcrumb"}}
    }},
    {{
      "@type": "BreadcrumbList",
      "@id": "{SITE_URL}/services.html#breadcrumb",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "{SITE_URL}/"}},
        {{"@type": "ListItem", "position": 2, "name": "Servizi", "item": "{SITE_URL}/services.html"}}
      ]
    }},
    {{
      "@type": "ItemList",
      "name": "Servizi MLP Studio Creativo",
      "itemListElement": [
        {",".join(items)}
      ]
    }}
  ]
}}
</script>
'''


def project_schema(slug, title, description):
    """Pagina progetto — WebPage + Breadcrumb + CreativeWork."""
    page_url = f"{SITE_URL}/projects/{slug}.html"
    # Nome caso studio = titolo pulito
    project_name = title.split("—")[0].strip().rstrip(".")
    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "WebPage",
      "@id": "{page_url}#webpage",
      "url": "{page_url}",
      "name": "{escape_json(title)}",
      "description": "{escape_json(description)}",
      "isPartOf": {{"@id": "{SITE_URL}/#website"}},
      "inLanguage": "it-IT",
      "breadcrumb": {{"@id": "{page_url}#breadcrumb"}}
    }},
    {{
      "@type": "BreadcrumbList",
      "@id": "{page_url}#breadcrumb",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "{SITE_URL}/"}},
        {{"@type": "ListItem", "position": 2, "name": "Portfolio", "item": "{SITE_URL}/#portfolio"}},
        {{"@type": "ListItem", "position": 3, "name": "{escape_json(project_name)}", "item": "{page_url}"}}
      ]
    }},
    {{
      "@type": "CreativeWork",
      "@id": "{page_url}#creativework",
      "name": "{escape_json(title)}",
      "headline": "{escape_json(title)}",
      "description": "{escape_json(description)}",
      "url": "{page_url}",
      "inLanguage": "it-IT",
      "creator": {{"@id": "{SITE_URL}/#organization"}},
      "author": {{"@id": "{SITE_URL}/#organization"}},
      "publisher": {{"@id": "{SITE_URL}/#organization"}},
      "about": {{"@type": "Organization", "name": "{escape_json(project_name)}"}}
    }}
  ]
}}
</script>
'''


def escape_json(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


# --------- Utility patch ---------

# Marker per idempotenza: se già presente non re-inserire
MARKER = "<!-- SEO: JSON-LD + OG (claude-seo) -->"


def extract_title_desc(html):
    """Estrai title e meta description da HTML."""
    m_title = re.search(r"<title>([^<]+)</title>", html)
    m_desc = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
    title = unescape(m_title.group(1)) if m_title else ""
    desc = unescape(m_desc.group(1)) if m_desc else ""
    return title, desc


def inject_head(html, block, marker=MARKER):
    """Inserisce block prima di </head>, marcato per idempotenza."""
    if marker in html:
        # rimuovi vecchio inserimento tra marker e end-marker
        html = re.sub(
            re.escape(marker) + r".*?" + re.escape("<!-- /SEO -->"),
            "",
            html,
            flags=re.DOTALL,
        )
    insert = f"\n{marker}\n{block}\n<!-- /SEO -->\n"
    return html.replace("</head>", f"{insert}</head>", 1)


# --------- Esecuzione ---------

def patch_homepage():
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    # Accorcia meta description (155 char max)
    new_desc = "MLP Studio Creativo. Branding, web design, editoriale e visual per brand esigenti. Sede a San Donà di Piave, Italia ed Europa."
    html = re.sub(
        r'<meta name="description" content="[^"]+"',
        f'<meta name="description" content="{new_desc}"',
        html,
        count=1,
    )
    # aria-label sull'H1 per rendere il testo accessibile ai crawler
    html = html.replace(
        '<h1 class="display">',
        '<h1 class="display" aria-label="MLP Studio Creativo — Studio Creativo Multidisciplinare a San Donà di Piave">',
        1,
    )
    block = (
        homepage_schema()
        + og_block(
            f"{SITE_URL}/",
            "MLP Studio Creativo — Studio Creativo Multidisciplinare · San Donà di Piave",
            new_desc,
            f"{SITE_URL}/logo.svg",
        )
    )
    html = inject_head(html, block)
    path.write_text(html, encoding="utf-8")
    print(f"OK  homepage: {path.name}")


def patch_services():
    path = ROOT / "services.html"
    html = path.read_text(encoding="utf-8")
    title, desc = extract_title_desc(html)
    block = (
        services_schema()
        + og_block(
            f"{SITE_URL}/services.html",
            title or "Servizi — MLP Studio Creativo",
            desc,
            f"{SITE_URL}/logo.svg",
        )
    )
    html = inject_head(html, block)
    path.write_text(html, encoding="utf-8")
    print(f"OK  services: {path.name}")


def patch_generic(rel_path, page_slug=None):
    """Applica solo WebPage + OG + canonical a pagine semplici."""
    path = ROOT / rel_path
    if not path.exists():
        print(f"SKIP {rel_path}: non trovato")
        return
    html = path.read_text(encoding="utf-8")
    title, desc = extract_title_desc(html)
    page_url = f"{SITE_URL}/{rel_path}"
    webpage = f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "{page_url}#webpage",
  "url": "{page_url}",
  "name": "{escape_json(title)}",
  "description": "{escape_json(desc)}",
  "isPartOf": {{"@id": "{SITE_URL}/#website"}},
  "about": {{"@id": "{SITE_URL}/#organization"}},
  "inLanguage": "it-IT"
}}
</script>
'''
    block = webpage + og_block(page_url, title, desc, f"{SITE_URL}/logo.svg")
    html = inject_head(html, block)
    path.write_text(html, encoding="utf-8")
    print(f"OK  page: {rel_path}")


def patch_projects():
    """Applica schema a tutte le pagine progetto."""
    projects_dir = ROOT / "projects"
    for html_file in sorted(projects_dir.glob("*.html")):
        html = html_file.read_text(encoding="utf-8")
        title, desc = extract_title_desc(html)
        slug = html_file.stem
        if not title:
            print(f"SKIP project (no title): {html_file.name}")
            continue
        block = project_schema(slug, title, desc) + og_block(
            f"{SITE_URL}/projects/{slug}.html",
            title,
            desc or title,
            f"{SITE_URL}/logo.svg",
            og_type="article",
        )
        html = inject_head(html, block)
        html_file.write_text(html, encoding="utf-8")
        print(f"OK  project: {html_file.name}")


def clean_robots_sitemap():
    """Rimuovi commenti 'sostituire dominio' e ripulisci sitemap."""
    robots = ROOT / "robots.txt"
    robots_text = "User-agent: *\nAllow: /\n\nSitemap: https://www.mlpstudiocreativo.com/sitemap.xml\n"
    robots.write_text(robots_text, encoding="utf-8")
    print("OK  robots.txt ripulito")

    sitemap = ROOT / "sitemap.xml"
    text = sitemap.read_text(encoding="utf-8")
    # rimuovi il commento iniziale
    text = re.sub(r"<!--.*?-->\s*", "", text, count=1, flags=re.DOTALL)
    sitemap.write_text(text, encoding="utf-8")
    print("OK  sitemap.xml ripulito")


if __name__ == "__main__":
    patch_homepage()
    patch_services()
    for p in ["production.html", "eventi.html", "wedding.html", "carriere.html", "privacy.html"]:
        patch_generic(p)
    patch_projects()
    clean_robots_sitemap()
    print("\nDone.")
