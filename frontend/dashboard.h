<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CAAR — Mon Espace</title>
  <link rel="stylesheet" href="/resources/css/style.css" />
</head>
<body>
<div class="app-layout">

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-text">CAAR</div>
      <div class="role-badge">Espace Client</div>
    </div>
    <nav class="sidebar-nav">
      <a href="/dashboard.html" class="active">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Tableau de bord
      </a>
      <a href="#">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Mes Contrats
      </a>
      <a href="#">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        Mes Sinistres
      </a>
      <a href="#">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        Mon Profil
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-name" id="sidebarName">Chargement...</div>
      <div class="user-email" id="sidebarEmail"></div>
      <button class="btn btn-outline logout-btn" onclick="logout()">Se déconnecter</button>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="main-content">
    <div class="page-header">
      <h1>Bonjour, <span id="userName">—</span> 👋</h1>
      <p>Bienvenue dans votre espace personnel CAAR.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div>
          <div class="label">Contrats actifs</div>
          <div class="value">2</div>
        </div>
        <div class="icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
      </div>
      <div class="stat-card">
        <div>
          <div class="label">Sinistres en cours</div>
          <div class="value">0</div>
        </div>
        <div class="icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z"/></svg>
        </div>
      </div>
      <div class="stat-card">
        <div>
          <div class="label">Prochaine échéance</div>
          <div class="value" style="font-size:1.2rem;">15 Avr</div>
        </div>
        <div class="icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Mes Contrats <a href="#" class="btn btn-primary" style="font-size:0.82rem;padding:6px 16px;">+ Nouveau</a></div>
      <table>
        <thead>
          <tr><th>Produit</th><th>Référence</th><th>Statut</th><th>Échéance</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Assurance Auto</td>
            <td>#AA-2024-001</td>
            <td><span class="badge badge-admin">Actif</span></td>
            <td>15 Avr 2026</td>
          </tr>
          <tr>
            <td>Assurance Habitation</td>
            <td>#AH-2024-002</td>
            <td><span class="badge badge-admin">Actif</span></td>
            <td>30 Juin 2026</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</div>

<script>
  // Auth guard
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "/login.html"; }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  document.getElementById("userName").textContent = user.name || "Client";
  document.getElementById("sidebarName").textContent = user.name || "Client";
  document.getElementById("sidebarEmail").textContent = user.email || "";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
  }
</script>
</body>
</html>