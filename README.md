# MLP Studio Creativo — Sito ufficiale

Sito statico dello studio creativo multidisciplinare **MLP Studio Creativo**, con sede a San Donà di Piave (Venezia).  
Branding, web design, editoriale, visual per brand in Veneto, Italia ed Europa.

---

## Struttura della cartella

```
sito-mlp-studio/
├── index.html              # Homepage
├── services.html           # Pagina servizi
├── logo.svg                # Logo vettoriale
├── favicon.svg             # Favicon (riusa il logo)
├── robots.txt              # Direttive crawler
├── sitemap.xml             # Mappa del sito per SEO
├── netlify.toml            # Config deploy Netlify
├── vercel.json             # Config deploy Vercel
├── .gitignore              # File ignorati da git
├── README.md               # Questo file
└── projects/               # 27 case study
    ├── alfabeto-nord.html
    ├── amaro-selvatico.html
    ├── ... (altri 25 progetti)
    └── img/                # Immagini dei progetti
        ├── biys/
        ├── de-piccoli/
        ├── forte48/
        ├── light/
        ├── origo/
        ├── piave-pesca/
        └── retro/
```

---

## Caratteristiche tecniche

- **Stack**: HTML5 + CSS3 (inline) + vanilla JavaScript
- **Font**: Google Fonts (Nunito Sans, Roboto)
- **Responsive**: mobile-first
- **Nessuna build**: file statici pronti al deploy
- **Accessibile**: lingua `it`, meta description, struttura semantica

---

## Anteprima locale

Puoi aprire `index.html` direttamente nel browser, oppure servirlo con un web server locale:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (con npx)
npx serve .
```

Poi visita `http://localhost:8000`.

---

## Deploy

### Netlify
1. Trascina la cartella su [app.netlify.com/drop](https://app.netlify.com/drop) **oppure**
2. Collega il repository e Netlify userà `netlify.toml` automaticamente.

### Vercel
1. `vercel` da terminale nella cartella **oppure**
2. Importa il progetto su [vercel.com](https://vercel.com) — `vercel.json` è già configurato.

### Hosting tradizionale (FTP / cPanel)
Carica tutto il contenuto della cartella nella root del tuo hosting (es. `public_html/`).

---

## SEO checklist

- [x] `sitemap.xml` generato
- [x] `robots.txt` pubblicato
- [x] Meta description in ogni pagina principale
- [x] Lingua `it` dichiarata
- [ ] Sostituire il dominio `https://www.mlpstudiocreativo.it/` in `sitemap.xml` e `robots.txt` con quello reale
- [ ] Collegare Google Search Console e inviare la sitemap
- [ ] Aggiungere Open Graph e Twitter Card (consigliato)

---

## Case study presenti

Alfabeto Nord · Amaro Selvatico · Atlante Materie · BIYS · Camera · Camera Oscura · Casa Verde Hotel · Corte · De Piccoli · Dott. MR Medicina · Elena P Coach · Fornara Caffè · Forte48 · Internoventi · Ipotesi Stella · Light Bistrot · Lorenzo B Chef · Nero · Nordika Skincare · Origo · Osservatorio · Ottica Borin · Piave Pesca · Retro Specialisti della Carne · Rivista Oblique · Specimen · Stanze

---

## Contatti

**MLP Studio Creativo**  
San Donà di Piave (VE) — Italia  
[@mlpstudiocreativo](https://www.instagram.com/mlpstudiocreativo/)
