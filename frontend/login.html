<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CAAR — Connexion</title>
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --orange: #E8761E;
      --orange-dark: #C9601A;
      --dark: #1C1C1C;
      --gray: #666;
      --border: #e0e0e0;
      --white: #fff;
      --font-serif: 'Lora', serif;
      --font-sans: 'Source Sans 3', sans-serif;
    }
    body { font-family: var(--font-sans); background: var(--white); min-height: 100vh; display: flex; }

    /* ── LEFT PANEL ── */
    .left-panel {
      width: 46%; background: var(--orange);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 48px; position: relative; overflow: hidden;
    }
    .left-panel::before {
      content: ''; position: absolute; top: -80px; right: -80px;
      width: 320px; height: 320px; border-radius: 50%;
      background: rgba(255,255,255,0.1);
    }
    .left-panel::after {
      content: ''; position: absolute; bottom: -60px; left: -60px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(255,255,255,0.07);
    }
    .left-panel h2 {
      font-family: var(--font-serif); font-size: 2rem; color: var(--white);
      font-weight: 700; margin-bottom: 20px; line-height: 1.25;
      position: relative; z-index: 1; text-align: center;
    }
    .left-panel p {
      color: rgba(255,255,255,0.88); font-size: 0.92rem; text-align: center;
      line-height: 1.6; max-width: 300px; position: relative; z-index: 1; margin-bottom: 36px;
    }
    .left-illustration {
      position: relative; z-index: 1;
      background: var(--white); border-radius: 10px;
      padding: 10px; width: 220px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    }
    .left-illustration img {
      width: 100%; height: auto; display: block; border-radius: 6px;
    }

    /* ── RIGHT PANEL ── */
    .right-panel {
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; padding: 60px 10%;
      background: var(--white);
    }
    .brand { font-family: var(--font-serif); font-size: 1.15rem; color: var(--orange); font-weight: 700; margin-bottom: 10px; }
    .right-panel h1 { font-family: var(--font-serif); font-size: 1.9rem; font-weight: 700; margin-bottom: 6px; color: var(--dark); }
    .right-panel .sub { font-size: 0.88rem; color: var(--gray); margin-bottom: 36px; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 7px; color: var(--dark); }
    .form-group input {
      width: 100%; padding: 13px 16px; border: 1.5px solid var(--border);
      border-radius: 8px; font-family: var(--font-sans); font-size: 0.95rem;
      color: var(--dark); transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus { outline: none; border-color: var(--orange); box-shadow: 0 0 0 3px rgba(232,118,30,0.1); }

    .error-msg { color: #c0392b; font-size: 0.82rem; margin-bottom: 14px; min-height: 18px; }

    .btn-login {
      width: 100%; padding: 15px; background: var(--orange); color: var(--white);
      border: none; border-radius: 8px; font-family: var(--font-sans);
      font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
      margin-bottom: 20px;
    }
    .btn-login:hover { background: var(--orange-dark); }
    .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

    .form-footer { text-align: center; font-size: 0.88rem; color: var(--gray); }
    .form-footer a { color: var(--orange); font-weight: 600; text-decoration: none; }
    .form-footer a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .left-panel { display: none; }
      .right-panel { padding: 48px 8%; }
    }
  </style>
</head>
<body>

  <!-- LEFT: Orange panel -->
  <div class="left-panel">
    <h2>Votre espace assurance, en ligne.</h2>
    <p>Gérez vos contrats, suivez vos sinistres et souscrivez en toute sécurité depuis n'importe où.</p>
    <div class="left-illustration">
      <img src="/resources/img/illustration.jpg" alt="CAAR illustration"/>
    </div>
  </div>

  <!-- RIGHT: Login form -->
  <div class="right-panel">
    <div class="brand">CAAR</div>
    <h1>Connexion</h1>
    <p class="sub">Accédez à votre espace personnel</p>

    <div class="form-group">
      <label for="email">Adresse e-mail</label>
      <input type="email" id="email" placeholder="votre@email.com" autocomplete="email"/>
    </div>

    <div class="form-group">
      <label for="password">Mot de passe</label>
      <input type="password" id="password" placeholder="••••••••" autocomplete="current-password"/>
    </div>

    <p class="error-msg" id="errorMsg"></p>

    <button class="btn-login" id="loginBtn" onclick="doLogin()">Se connecter</button>

    <div class="form-footer">
      Pas encore de compte ? <a href="/register.html">Créer un compte</a>
    </div>
  </div>

  <script>
    // If already logged in, redirect to homepage
    if (localStorage.getItem('token')) {
      window.location.href = '/index.html';
    }

    async function doLogin() {
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errEl    = document.getElementById('errorMsg');
      const btn      = document.getElementById('loginBtn');

      errEl.textContent = '';
      if (!email || !password) { errEl.textContent = 'Veuillez remplir tous les champs.'; return; }

      btn.disabled = true; btn.textContent = 'Connexion en cours...';

      try {
        const res  = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) { errEl.textContent = data.message || 'Identifiants invalides.'; return; }

        // Decode JWT to get role
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ Admin → admin panel | Everyone else → homepage
        if (payload.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/index.html';
        }
      } catch(e) {
        errEl.textContent = 'Erreur serveur. Réessayez.';
      } finally {
        btn.disabled = false; btn.textContent = 'Se connecter';
      }
    }

    // Enter key support
    document.getElementById('password').addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  </script>

</body>
</html>