@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

:root {
  --orange:      #E8761E;
  --orange-dark: #C9601A;
  --orange-lt:   #FFF3E8;
  --orange-bg:   #F4DDC4;
  --cib:         #F57C00;
  --dark:        #1C1C1C;
  --gray:        #666;
  --border:      #E0E0E0;
  --white:       #fff;
  --hdr-orange:  #F57C00;
}

body   { font-family:'DM Sans',system-ui,sans-serif; color:var(--dark); background:var(--white); line-height:1.6; }
a      { text-decoration:none; color:inherit; }
img    { max-width:100%; display:block; }

/* ================================================
   PARTIE 1 : HEADER
   ================================================ */
.header {
  background: var(--white);
  box-shadow: 0 2px 10px rgba(0,0,0,0.09);
  position: sticky; top: 0; z-index: 1000;
}
.header-inner { display:flex; align-items:stretch; padding:0 40px; }
.logo-block {
  display:flex; align-items:center;
  padding: 8px 24px 8px 0;
  flex-shrink:0;
  border-right:1px solid var(--border);
}
.logo-img { width:140px; height:140px; object-fit:contain; }
.right-side { display:flex; flex-direction:column; flex:1; }
.top-row {
  display:flex; justify-content:flex-end; align-items:center;
  gap:14px; padding:14px 0 14px 20px;
}
.btn-top {
  padding:9px 24px; background:var(--hdr-orange);
  border:2px solid var(--hdr-orange); border-radius:30px;
  color:var(--white); font-size:14px; font-weight:600; transition:background .2s;
}
.btn-top:hover { background:#e06d00; border-color:#e06d00; }
.divider { border:none; border-top:1px solid var(--border); }
.bottom-row { display:flex; align-items:center; justify-content:space-between; flex:1; }
.nav-links {
  display:flex; align-items:center; list-style:none;
  flex:1; justify-content:space-between;
}
.nav-link {
  display:flex; align-items:center; gap:4px;
  padding:16px 14px; font-size:15px; font-weight:600;
  color:var(--dark); position:relative; transition:color .2s;
}
.nav-link:hover { color:var(--hdr-orange); }
.nav-link.active { color:var(--hdr-orange); }
.nav-link.active::after {
  content:''; position:absolute; bottom:0; left:14px; right:14px;
  height:3px; background:var(--hdr-orange); border-radius:3px 3px 0 0;
}
.arrow { font-size:14px; color:var(--hdr-orange); font-weight:700; transition:transform .2s; }
.dropdown { position:relative; list-style:none; }
.dropdown-menu {
  display:none; position:absolute; top:calc(100% + 2px); left:0;
  background:var(--white); border:1px solid var(--border);
  border-radius:6px; min-width:200px;
  box-shadow:0 8px 20px rgba(0,0,0,.12); list-style:none; padding:6px 0; z-index:999;
}
.dropdown:hover .dropdown-menu { display:block; }
.dropdown:hover .arrow { transform:rotate(180deg); }
.dropdown-menu li a {
  display:block; padding:11px 20px; font-size:13px; color:var(--dark);
  text-transform:uppercase; letter-spacing:.3px;
  border-bottom:1px solid #f0f0f0; transition:background .15s, color .15s;
}
.dropdown-menu li:last-child a { border-bottom:none; }
.dropdown-menu li a:hover { background:#fff5e6; color:var(--hdr-orange); }
.nav-icons { display:flex; align-items:center; gap:4px; }
.icon-btn {
  background:none; border:none; cursor:pointer;
  display:flex; align-items:center; gap:5px;
  padding:6px 8px; border-radius:6px; transition:background .2s;
}
.icon-btn:hover { background:#f5f5f5; }
.icon-img { width:26px; height:26px; object-fit:contain; }
.lang-label { font-size:13px; font-weight:700; color:var(--dark); }
.lang-dropdown { position:relative; }
.lang-menu {
  display:none; position:absolute; top:calc(100% + 6px); right:0;
  background:var(--white); border:1px solid var(--border);
  border-radius:6px; min-width:160px;
  box-shadow:0 8px 20px rgba(0,0,0,.12); list-style:none; padding:6px 0; z-index:999;
}
.lang-dropdown:hover .lang-menu { display:block; }
.lang-menu li a {
  display:block; padding:9px 16px; font-size:13px; color:var(--dark);
  transition:background .15s, color .15s;
}
.lang-menu li a:hover { background:#fff5e6; color:var(--hdr-orange); }
.search-bar {
  display:none; align-items:center; padding:10px 40px;
  border-top:1px solid var(--border); gap:10px;
}
.search-bar.open { display:flex; }
.search-input {
  flex:1; padding:9px 16px; border:1.5px solid var(--hdr-orange);
  border-radius:25px; font-size:14px; outline:none;
}
.search-close {
  background:none; border:none; font-size:18px;
  cursor:pointer; color:#666; padding:4px 8px; border-radius:50%;
}
.search-close:hover { background:#f0f0f0; }

/* ================================================
   PARTIE 2 : HERO
   ================================================ */
.hero {
  background:#fff; position:relative; overflow:hidden;
  padding:0 48px; border-bottom:1px solid var(--border);
}
.hero-deco {
  position:absolute; bottom:80px; left:20px; width:55%; max-width:650px;
  opacity:.5; z-index:0; pointer-events:none;
}
.hero-top {
  display:flex; align-items:flex-end; justify-content:space-between;
  position:relative; z-index:1;
}
.hero-left {
  flex:1; padding:50px 40px 30px 0;
  display:flex; flex-direction:column; gap:20px;
}
.hero-title { font-size:30px; font-weight:800; color:var(--dark); line-height:1.3; }
.hero-subtitle { font-size:16px; color:#555; line-height:1.8; }
.hero-buttons { display:flex; gap:16px; flex-wrap:wrap; }
.hero-btn-orange {
  padding:12px 28px; background:var(--hdr-orange);
  border:2px solid var(--hdr-orange); border-radius:30px;
  color:#fff; font-size:14px; font-weight:700; transition:background .22s;
}
.hero-btn-orange:hover { background:#e06d00; border-color:#e06d00; }
.hero-btn-white {
  padding:12px 28px; background:#fff; border:2px solid var(--dark);
  border-radius:30px; color:var(--dark); font-size:14px; font-weight:700;
  transition:background .22s, color .22s, border-color .22s;
}
.hero-btn-white:hover { background:var(--hdr-orange); border-color:var(--hdr-orange); color:#fff; }
.hero-right { flex-shrink:0; width:380px; display:flex; align-items:flex-end; }
.hero-img { width:100%; height:auto; object-fit:contain; display:block; }
.hero-bottom { display:flex; justify-content:center; position:relative; z-index:1; }
.hero-cib {
  display:block; width:60%; background:var(--hdr-orange);
  border:2px solid var(--hdr-orange); border-radius:14px;
  padding:22px 36px; text-align:center; font-size:16px; font-weight:700;
  color:#fff; line-height:1.6; transition:background .22s; margin-bottom:30px;
}
.hero-cib:hover { background:#e06d00; border-color:#e06d00; }

/* ================================================
   PARTIE 3 : PRODUCTS (style de l'ami)
   ================================================ */
.products { padding:50px 7% 60px; border-top:2px solid #000; border-bottom:2px solid #000; }
.products-title { font-size:1.4rem; font-weight:700; margin-bottom:32px; }
.products-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:24px;
  max-width:860px; margin:0 auto;
}
.product-card {
  aspect-ratio:1/1; display:flex; align-items:center; justify-content:center;
  border:3px solid #000; border-radius:18px; background:#fff; overflow:hidden;
  padding:14px; transition:transform .2s, box-shadow .2s;
}
.product-card:hover { transform:translateY(-4px); box-shadow:0 8px 20px rgba(0,0,0,.1); }
.product-card img { width:74%; height:74%; object-fit:contain; }
.other-card { flex-direction:column; gap:10px; font-weight:700; font-size:.96rem; text-align:center; color:var(--dark); }
.arrow-circle { width:42px; height:42px; border:2px solid var(--dark); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; }

/* ================================================
   PARTIE 4 : WHY CHOOSE CAAR (style de l'ami)
   ================================================ */
.why { padding:72px 7%; text-align:center; }
.why-header h2 { font-family:'Playfair Display',Georgia,serif; font-size:2rem; font-weight:700; margin-bottom:10px; }
.why-header h2 span { color:var(--orange); }
.why-header p { color:var(--gray); font-size:.94rem; line-height:1.6; margin-bottom:48px; }
.why-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; max-width:960px; margin:0 auto; align-items:start; }
.why-card { background:var(--orange-bg); padding:26px 28px; border-radius:24px; text-align:left; transition:transform .3s, box-shadow .3s; }
.why-card:hover { transform:translateY(-5px); box-shadow:0 12px 28px rgba(0,0,0,.1); }
.why-card h3 { color:var(--orange); font-size:.98rem; font-weight:700; margin-bottom:10px; }
.why-card ul { list-style:none; font-size:.88rem; line-height:1.85; }
.why-card li::before { content:"• "; font-weight:700; }
.why-circles { grid-column:1/-1; display:flex; align-items:center; justify-content:center; gap:32px; padding:16px; }
.circle { width:148px; height:148px; border-radius:50%; background:var(--orange-bg); display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:700; font-size:1.8rem; font-style:italic; color:var(--orange); text-align:center; line-height:1.1; flex-shrink:0; transition:transform .3s; }
.circle span { font-size:.78rem; font-weight:400; font-style:italic; color:var(--orange); margin-top:5px; line-height:1.3; max-width:100px; }
.circle:hover { transform:scale(1.06); }

/* ================================================
   PARTIE 5 : NETWORK + NEWS (corrigée)
   ================================================ */
.network-news { padding:60px 7%; border-top:2px solid #000; }
.network-outer { max-width:1200px; margin:0 auto; }

/* Layout principal : gauche | homme droite */
.network-main {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 40px;
  align-items: stretch;
}

/* GAUCHE : toutes les lignes empilées */
.network-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Ligne 1 : pin + titre */
.network-title-group { display:flex; align-items:center; gap:14px; }
.network-pin { width:44px; height:54px; flex-shrink:0; }
.network-title-group h2 { font-size:1.35rem; font-weight:700; line-height:1.25; }

/* Ligne 2 : description + bouton côte à côte */
.network-desc-row {
  display: flex;
  align-items: center;
  gap: 24px;
}
.network-desc {
  font-size: .92rem;
  color: var(--dark);
  font-weight: 700;
  line-height: 1.6;
  flex: 1;
}
.network-btn {
  display: inline-block;
  padding: 11px 28px;
  border: 3px solid var(--orange);
  background: var(--orange);
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background .2s, color .2s, border-color .2s;
}
.network-btn:hover { background:#e06d00; border-color:#e06d00; }

/* Ligne 3 : Latest News header — occupe toute la largeur */
.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.news-header h3 {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--orange);
  flex: 1;
}
/* View All News — plus grand */
.news-all {
  color: var(--orange);
  font-weight: 700;
  font-size: 1.05rem;
  white-space: nowrap;
  margin-left: 16px;
}

/* Ligne 4 : 3 news cards — même hauteur pour aligner Read more */
.news-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 24px;
}
.news-card {
  border-top: 2px solid var(--orange);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* Date : orange, centrée sous le trait */
.news-date {
  display: block;
  font-size: .73rem;
  color: var(--orange);
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
}
.news-card h4 {
  font-size: .88rem;
  font-weight: 700;
  line-height: 1.4;
  flex: 1;
}
/* Read more : tous alignés sur la même ligne grâce à margin-top:auto */
.news-card > a {
  font-size: .82rem;
  color: var(--orange);
  font-weight: 600;
  text-decoration: underline;
  transition: color .2s;
  margin-top: auto;
  display: block;
}
.news-card > a:hover { color: var(--orange-dark); }

/* DROITE : homme plus grand, collé vers le haut */
.network-illustration {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-top: 0;
}
.network-illustration img {
  height: 480px;
  width: auto;
  object-fit: contain;
  margin-right: -20px;
}

/* ================================================
   PARTIE 6 : CTA
   ================================================ */
.cta { background:var(--cib); padding:68px 20px; text-align:center; color:#fff; }
.cta-inner { max-width:720px; margin:0 auto; }
.cta h2 { font-size:1.45rem; font-weight:700; margin-bottom:12px; }
.cta p  { font-size:.93rem; opacity:.92; margin-bottom:28px; }
.cta-btn { display:inline-block; padding:13px 48px; background:var(--white); color:var(--dark); border:3px solid var(--dark); font-weight:700; font-size:.97rem; transition:background .2s, color .2s; }
.cta-btn:hover { background:var(--dark); color:#fff; }

/* ================================================
   FOOTER
   ================================================ */
.footer { background:#3F3F3F; color:#ccc; padding:44px 7% 0; }
.footer-inner { max-width:1200px; margin:0 auto; padding-bottom:32px; border-bottom:1px solid rgba(255,255,255,.14); }
.footer-grid { display:grid; grid-template-columns:1.6fr 1fr 1.8fr 1fr; grid-template-rows:auto auto; column-gap:40px; row-gap:16px; align-items:start; }
.footer-logo { grid-column:1; grid-row:1; width:38px; height:38px; border-radius:50%; overflow:hidden; align-self:center; }
.footer-logo img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
.footer-col { grid-row:1/span 2; }
.footer-col h4 { color:#fff; font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.8px; margin-bottom:16px; height:38px; display:flex; align-items:center; }
.footer-col-1 { grid-column:1; grid-row:2; }
.footer-item { display:flex; align-items:flex-start; gap:10px; font-size:.82rem; color:#ccc; margin-bottom:10px; line-height:1.4; }
.footer-item svg { width:14px; height:14px; stroke:var(--orange); fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; flex-shrink:0; margin-top:2px; }
.footer-col a { display:block; font-size:.82rem; color:#ccc; margin-bottom:9px; transition:color .2s; }
.footer-col a:hover { color:#fff; }
.footer-social { display:flex; gap:8px; }
.footer-social a { width:32px; height:32px; border-radius:50%; border:2px solid var(--orange); background:transparent; color:var(--orange); display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:.82rem; transition:background .2s, color .2s; }
.footer-social a:hover { background:var(--orange); color:#fff; }
.footer-bottom { text-align:center; font-size:.78rem; color:#999; padding:16px 0 20px; max-width:1200px; margin:0 auto; }