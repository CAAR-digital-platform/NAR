<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CAAR &mdash; About Us</title>

  <!-- FONTS -->
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet"/>

  <!-- Shared stylesheet (replaces style.css for this page) -->
  <link rel="stylesheet" href="main.css"/>

  <style>
    /* ============================================================
       PAGE-SPECIFIC STYLES — header/footer come from main.css
    ============================================================ */

    /* ================= HERO ================= */
    .about-hero {
      position: relative;
      padding: 50px 0 40px;
      background: #fff;
      overflow: hidden;
    }
    .about-brush {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 650px;
      opacity: 0.55;
    }
    .about-hero-inner {
      position: relative;
      z-index: 2;
      max-width: 1200px;
      margin: auto;
      padding: 0 60px;
    }
    .about-title {
      font-family: 'Playfair Display';
      font-size: 3.2rem;
      font-weight: 700;
      color: #000;
    }
    .about-subtitle {
      font-size: 1.15rem;
      color: #222;
      margin-top: 20px;
      max-width: 520px;
    }
    @media (max-width:768px){
      .about-hero-inner { padding: 0 20px; }
      .about-brush { width: 350px; opacity: 0.3; }
    }

    /* ================= COMPANY SECTION ================= */
    .company-section {
      background: #fff;
      padding: 40px 0 70px;
    }

    .company-section-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      gap: 32px;
      align-items: flex-start;
    }

    .company-nav {
      flex-shrink: 0;
      width: 220px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .company-nav-btn {
      display: block;
      width: 100%;
      padding: 15px 22px;
      background: #1a1a1a;
      color: #fff;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.94rem;
      font-weight: 600;
      text-align: left;
      border: none;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .company-nav-btn:hover { background: #333; }
    .company-nav-btn.active { background: #E8761E; }

    .company-content {
      flex: 1;
      background: #F5EDE0;
      border-radius: 18px;
      padding: 32px 32px 24px;
      display: flex;
      flex-direction: column;
      min-height: 520px;
    }

    .company-content-box {
      background: #fff;
      border-radius: 14px;
      padding: 32px 36px;
      flex: 1;
      overflow-y: auto;
      max-height: 440px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      color: #222;
      line-height: 1.85;
    }
    .company-content-box p { margin-bottom: 14px; }
    .company-content-box p:last-child { margin-bottom: 0; }

    .company-content-box::-webkit-scrollbar { width: 5px; }
    .company-content-box::-webkit-scrollbar-track { background: #f0ebe4; border-radius: 4px; }
    .company-content-box::-webkit-scrollbar-thumb { background: #d4b896; border-radius: 4px; }

    .company-back-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .company-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 2px solid #E8761E;
      color: #E8761E;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 10px 22px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .company-back-btn:hover { background: #E8761E; color: #fff; }
    .company-back-btn svg {
      width: 16px; height: 16px;
      stroke: currentColor; fill: none;
      stroke-width: 2.5;
      stroke-linecap: round; stroke-linejoin: round;
    }

    @media (max-width: 900px) {
      .company-section-inner { flex-direction: column; padding: 0 16px; }
      .company-nav { width: 100%; flex-direction: row; flex-wrap: wrap; }
      .company-nav-btn { flex: 1; }
    }

    /* ================= OVERVIEW TAB ================= */
    .overview-card {
      position: relative;
      overflow: hidden;
      padding: 0;
    }

    .overview-card::before {
      content: '';
      position: absolute;
      top: -60px; right: -80px;
      width: 340px; height: 340px;
      background: radial-gradient(circle, #E8761E 0%, transparent 70%);
      opacity: 0.10;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }
    .overview-card::after {
      content: '';
      position: absolute;
      bottom: 20px; left: -50px;
      width: 180px; height: 180px;
      background: radial-gradient(circle, #E8761E 0%, transparent 70%);
      opacity: 0.07;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }

    .overview-inner { position: relative; z-index: 1; }

    .overview-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }

    .overview-icon {
      width: 44px; height: 44px;
      background: #E8761E;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .overview-icon svg {
      width: 22px; height: 22px;
      stroke: #fff; fill: none;
      stroke-width: 2;
      stroke-linecap: round; stroke-linejoin: round;
    }

    .overview-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.45rem; font-weight: 700;
      color: #1a1a1a; margin: 0;
    }

    .overview-rule {
      width: 52px; height: 3px;
      background: #E8761E;
      border-radius: 2px;
      margin-bottom: 18px;
    }

    .overview-description {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.92rem; color: #444;
      line-height: 1.85; margin-bottom: 26px;
    }

    .overview-stats { display: flex; gap: 16px; }

    .stat-box {
      flex: 1;
      background: #fafafa;
      border: 1px solid #ececec;
      border-radius: 12px;
      padding: 20px 18px 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 8px;
      transition: box-shadow 0.2s, transform 0.2s;
      cursor: default;
    }

    .stat-box:hover {
      box-shadow: 0 6px 20px rgba(232, 118, 30, 0.12);
      transform: translateY(-2px);
    }

    .stat-highlight {
      font-family: 'Playfair Display', serif;
      font-size: 1.7rem; font-weight: 700;
      color: #E8761E; line-height: 1;
    }

    .stat-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; font-weight: 500;
      color: #555; line-height: 1.4;
    }

    .stat-bar {
      height: 3px;
      background: linear-gradient(to right, #E8761E, #f5a964);
      border-radius: 2px; margin-top: 4px; opacity: 0.5;
    }

    .stat-icon {
      width: 32px; height: 32px;
      background: #FEF0E3;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 2px;
    }

    .stat-icon svg {
      width: 16px; height: 16px;
      stroke: #E8761E; fill: none;
      stroke-width: 2;
      stroke-linecap: round; stroke-linejoin: round;
    }

    @media (max-width: 700px) {
      .overview-stats { flex-direction: column; }
      .overview-title { font-size: 1.2rem; }
      .stat-highlight { font-size: 1.4rem; }
    }
  </style>
</head>

<body>

<!-- ================= HEADER — dynamically injected by main.js ================= -->
<div id="site-header"></div>

<!-- ================= HERO ================= -->
<section class="about-hero">
  <img src="img/fleche.png" class="about-brush"/>
  <div class="about-hero-inner">
    <h1 class="about-title">About CAAR</h1>
    <p class="about-subtitle">
      CAAR is a national insurance and reinsurance company
      serving individuals, professionals, and institutions.
    </p>
  </div>
</section>

<!-- ================= COMPANY NAV + CONTENT ================= -->
<section class="company-section">
  <div class="company-section-inner">

    <nav class="company-nav">
      <button class="company-nav-btn active" onclick="showTab('overview', this)">Overview</button>
      <button class="company-nav-btn" onclick="showTab('activities', this)">Activities</button>
      <button class="company-nav-btn" onclick="showTab('leadership', this)">Leadership</button>
      <button class="company-nav-btn" onclick="showTab('history', this)">History</button>
      <button class="company-nav-btn" onclick="showTab('organization', this)">Organization</button>
      <button class="company-nav-btn" onclick="showTab('keyfigures', this)">Key Figures</button>
    </nav>

    <div class="company-content">

      <!-- OVERVIEW -->
      <div class="company-content-box overview-card" id="tab-overview">
        <div class="overview-inner">
          <div class="overview-header">
            <div class="overview-icon">
              <svg viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2 class="overview-title">Company Overview</h2>
          </div>
          <div class="overview-rule"></div>
          <p class="overview-description">
            The Compagnie Algérienne d'Assurance et de Réassurance (CAAR) is a major player in the national insurance market. Founded in 1963, it has supported the country's economic development for decades, providing comprehensive protection for individuals, businesses, and industrial complexes.
          </p>
          <div class="overview-stats">
            <div class="stat-box">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="stat-highlight">60+</div>
              <div class="stat-label">Years of Experience</div>
              <div class="stat-bar"></div>
            </div>
            <div class="stat-box">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="stat-highlight">48</div>
              <div class="stat-label">Wilayas — National Presence</div>
              <div class="stat-bar"></div>
            </div>
            <div class="stat-box">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="stat-highlight">#1</div>
              <div class="stat-label">Leader in Industrial Risks</div>
              <div class="stat-bar"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- LEADERSHIP -->
      <div class="company-content-box" id="tab-leadership" style="display:none;">
        <p>Dear partners,<br/>Dear colleagues,</p>
        <p>Assuming the presidency of the Algerian Insurance and Reinsurance Company is for me an immense honor and a responsibility that I embrace with humility and determination.</p>
        <p>It is also a return to an institution to which I remain deeply attached, and whose history merges with that of the economic and social development of our country.</p>
        <p>For more than six decades, the CAAR has embodied solidity, trust and commitment. It has accompanied the major changes in the national economy, protected generations of citizens, and supported the ambitions of thousands of companies. This heritage is our pride, but also our responsibility: that of keeping it alive, strengthening it, and transmitting it.</p>
        <p>Today, a new stage opens.</p>
        <p>Our ambition is clear: to bring the CAAR into an era of modernity and agility, while remaining faithful to its identity as a reference company, close to its clients and faithful to its values.</p>
        <p>This involves:</p>
        <p>
          • Digitize our services to offer our policyholders a smooth, fast and accessible experience;<br/>
          • Strengthen our proximity with our customers, by placing their expectations and satisfaction at the heart of our priorities;<br/>
          • Valuing our internal talents, by encouraging innovation, continuous training and operational excellence;<br/>
          • Reaffirm our leadership role, adopting international best practices and anticipating market developments.
        </p>
        <p>This transformation will not be a break, but an ambitious continuity.</p>
        <p>It will build on the solid foundations of CAAR, while instilling a new dynamic focused on sustainable performance, social responsibility and value creation for all our stakeholders.</p>
        <p>To our employees, partners and clients: Thank you for your trust.</p>
        <p>The future of CAAR is built with you, and it is with you that we will face the challenges ahead.</p>
      </div>

      <!-- ACTIVITIES -->
      <div class="company-content-box" id="tab-activities" style="display:none;">
        <p>Content for <strong>Activities</strong> — coming soon.</p>
      </div>

      <!-- HISTORY -->
      <div class="company-content-box" id="tab-history" style="display:none;">
        <p>Content for <strong>History</strong> — coming soon.</p>
      </div>

      <!-- ORGANIZATION -->
      <div class="company-content-box" id="tab-organization" style="display:none;">
        <p>Content for <strong>Organization</strong> — coming soon.</p>
      </div>

      <!-- KEY FIGURES -->
      <div class="company-content-box" id="tab-keyfigures" style="display:none;">
        <p>Content for <strong>Key Figures</strong> — coming soon.</p>
      </div>

      <div class="company-back-row">
        <a href="index.html" class="company-back-btn">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </a>
      </div>

    </div>
  </div>
</section>

<!-- ================= FOOTER ================= -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-logo"><img src="img/caarfooter.jpg" alt="CAAR"/></div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="company.html">About Us</a>
        <a href="company-careers.html">Careers</a>
        <a href="news.html">News</a>
      </div>
      <div class="footer-col">
        <h4>Insurance</h4>
        <a href="auto-insurance.html">Auto Insurance</a>
        <a href="individual-risks.html">Entreprises Insurance</a>
        <a href="#">Natural Catastrophe Insurance</a>
        <a href="#">Multi-risk insurance for merchants</a>
      </div>
      <div class="footer-col">
        <h4>Follow Us</h4>
        <div class="footer-social"><a href="#" aria-label="Facebook">f</a></div>
      </div>
      <div class="footer-col-1">
        <div class="footer-item">
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>48 Rue Didouche Mourad, Algiers 16000</span>
        </div>
        <div class="footer-item">
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12.7 19.79 19.79 0 0 1 1.06 4.1 2 2 0 0 1 3 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>+213 21 34 10 16</span>
        </div>
        <div class="footer-item">
          <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span>contact@caar.dz</span>
        </div>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    &copy; 2026 CAAR &mdash; Compagnie Alg&eacute;rienne d&rsquo;Assurances et de R&eacute;assurances. All rights reserved.
  </div>
</footer>

<!-- Shared header logic — search, language, mobile menu, active nav -->
<script src="js/main.js"></script>

<script>
  /* ══════════════════════════════════════════════════════════
     PAGE-SPECIFIC SCRIPTS ONLY
     Header functionality (search, language, mobile menu)
     is handled exclusively by js/main.js above.
  ══════════════════════════════════════════════════════════ */

  /* ── Tabs ── */
  function showTab(tabId, btn) {
    document.querySelectorAll('.company-content-box').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.company-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabId).style.display = 'block';
    btn.classList.add('active');
  }
</script>

</body>
</html>