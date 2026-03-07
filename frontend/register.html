<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CAAR — Créer un compte</title>
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --orange: #E8761E;
      --orange-dark: #C9601A;
      --dark: #1C1C1C;
      --gray: #666;
      --gray-light: #f7f7f7;
      --border: #e0e0e0;
      --white: #fff;
      --font-serif: 'Lora', serif;
      --font-sans: 'Source Sans 3', sans-serif;
    }
    body {
      font-family: var(--font-sans); background: var(--gray-light);
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; padding: 40px 16px;
    }

    /* ── TOP BRAND BAR ── */
    .top-bar {
      width: 100%; max-width: 560px; display: flex;
      align-items: center; justify-content: space-between; margin-bottom: 28px;
    }
    .brand-name { font-family: var(--font-serif); font-size: 1.5rem; color: var(--orange); font-weight: 700; }
    .login-link { font-size: 0.85rem; color: var(--gray); }
    .login-link a { color: var(--orange); font-weight: 600; text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }

    /* ── CARD ── */
    .card {
      background: var(--white); border-radius: 16px;
      padding: 40px 40px 36px; width: 100%; max-width: 560px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.09);
    }
    .card-header { margin-bottom: 28px; }
    .card-header h1 { font-family: var(--font-serif); font-size: 1.7rem; font-weight: 700; margin-bottom: 6px; color: var(--dark); }
    .card-header p { font-size: 0.88rem; color: var(--gray); line-height: 1.5; }

    /* ── SECTION LABELS ── */
    .section-label {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: var(--orange); margin: 24px 0 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .section-label::after {
      content: ''; flex: 1; height: 1px; background: #f0e8e0;
    }

    /* ── FORM ROWS ── */
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

    .form-group { margin-bottom: 14px; }
    .form-group label {
      display: block; font-size: 0.8rem; font-weight: 600;
      margin-bottom: 6px; color: var(--dark);
    }
    .form-group label .required { color: var(--orange); margin-left: 2px; }
    .form-group input,
    .form-group select {
      width: 100%; padding: 12px 14px; border: 1.5px solid var(--border);
      border-radius: 8px; font-family: var(--font-sans); font-size: 0.9rem;
      color: var(--dark); background: var(--white);
      transition: border-color 0.2s, box-shadow 0.2s; appearance: none;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none; border-color: var(--orange);
      box-shadow: 0 0 0 3px rgba(232,118,30,0.1);
    }
    .form-group input.error { border-color: #e74c3c; }
    .form-group .hint { font-size: 0.75rem; color: #999; margin-top: 4px; }

    /* Gender radio */
    .gender-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .gender-option {
      border: 1.5px solid var(--border); border-radius: 8px;
      padding: 11px 14px; cursor: pointer; display: flex;
      align-items: center; gap: 10px; transition: all 0.2s;
    }
    .gender-option:hover { border-color: var(--orange); }
    .gender-option input[type="radio"] { accent-color: var(--orange); width: 16px; height: 16px; }
    .gender-option span { font-size: 0.88rem; font-weight: 500; }
    .gender-option.selected { border-color: var(--orange); background: #fff8f3; }

    /* Password strength */
    .pwd-strength { display: flex; gap: 4px; margin-top: 7px; }
    .pwd-bar { height: 4px; flex: 1; border-radius: 2px; background: var(--border); transition: background 0.3s; }
    .pwd-bar.weak { background: #e74c3c; }
    .pwd-bar.medium { background: #f39c12; }
    .pwd-bar.strong { background: #27ae60; }
    .pwd-label { font-size: 0.72rem; color: var(--gray); margin-top: 4px; }

    /* Terms checkbox */
    .terms-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 14px; background: #fff8f3; border-radius: 8px;
      border: 1px solid #f0e8e0; margin-top: 20px; margin-bottom: 6px;
    }
    .terms-row input[type="checkbox"] { accent-color: var(--orange); width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
    .terms-row label { font-size: 0.82rem; color: var(--gray); line-height: 1.5; cursor: pointer; }
    .terms-row label a { color: var(--orange); font-weight: 600; }

    /* Error summary */
    .error-msg { color: #c0392b; font-size: 0.82rem; margin: 10px 0 4px; min-height: 18px; }

    /* Submit */
    .btn-register {
      width: 100%; padding: 15px; background: var(--orange); color: var(--white);
      border: none; border-radius: 8px; font-family: var(--font-sans);
      font-size: 1rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s; margin-top: 16px;
    }
    .btn-register:hover { background: var(--orange-dark); }
    .btn-register:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Divider */
    .divider { text-align: center; margin: 18px 0; font-size: 0.8rem; color: #bbb; position: relative; }
    .divider::before, .divider::after {
      content: ''; position: absolute; top: 50%; width: 44%; height: 1px; background: var(--border);
    }
    .divider::before { left: 0; } .divider::after { right: 0; }

    .btn-back {
      width: 100%; padding: 13px; background: var(--white); color: var(--dark);
      border: 1.5px solid var(--border); border-radius: 8px;
      font-family: var(--font-sans); font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; text-align: center; display: block; text-decoration: none;
    }
    .btn-back:hover { border-color: var(--orange); color: var(--orange); }

    /* Progress indicator */
    .progress-steps {
      display: flex; justify-content: center; gap: 8px; margin-bottom: 28px;
    }
    .step-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--border);
      transition: all 0.3s;
    }
    .step-dot.active { background: var(--orange); transform: scale(1.3); }
    .step-dot.done { background: var(--orange); opacity: 0.4; }

    @media (max-width: 500px) {
      .card { padding: 28px 20px; }
      .row-2, .row-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="brand-name">CAAR</div>
    <div class="login-link">Déjà un compte ? <a href="/login.html">Se connecter</a></div>
  </div>

  <div class="card">
    <div class="card-header">
      <h1>Créer un compte</h1>
      <p>Rejoignez CAAR et gérez vos assurances en ligne, simplement et en toute sécurité.</p>
    </div>

    <p class="error-msg" id="globalError"></p>

    <!-- ── IDENTITY ── -->
    <div class="section-label">Identité</div>

    <div class="row-2">
      <div class="form-group">
        <label>Nom <span class="required">*</span></label>
        <input type="text" id="lastName" placeholder="Ex: Benali" autocomplete="family-name"/>
      </div>
      <div class="form-group">
        <label>Prénom <span class="required">*</span></label>
        <input type="text" id="firstName" placeholder="Ex: Yasmine" autocomplete="given-name"/>
      </div>
    </div>

    <div class="form-group">
      <label>Genre <span class="required">*</span></label>
      <div class="gender-row">
        <label class="gender-option" id="genderM" onclick="selectGender('M')">
          <input type="radio" name="gender" value="M"/> <span>Homme</span>
        </label>
        <label class="gender-option" id="genderF" onclick="selectGender('F')">
          <input type="radio" name="gender" value="F"/> <span>Femme</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>Date de naissance <span class="required">*</span></label>
      <div class="row-3">
        <div class="form-group" style="margin-bottom:0">
          <select id="dobDay">
            <option value="">Jour</option>
            <script>for(let i=1;i<=31;i++) document.write(`<option>${i}</option>`)</script>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <select id="dobMonth">
            <option value="">Mois</option>
            <option value="01">Janvier</option><option value="02">Février</option>
            <option value="03">Mars</option><option value="04">Avril</option>
            <option value="05">Mai</option><option value="06">Juin</option>
            <option value="07">Juillet</option><option value="08">Août</option>
            <option value="09">Septembre</option><option value="10">Octobre</option>
            <option value="11">Novembre</option><option value="12">Décembre</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <select id="dobYear">
            <option value="">Année</option>
            <script>for(let y=new Date().getFullYear()-16;y>=1940;y--) document.write(`<option>${y}</option>`)</script>
          </select>
        </div>
      </div>
    </div>

    <!-- ── CONTACT ── -->
    <div class="section-label">Contact</div>

    <div class="form-group">
      <label>Adresse e-mail <span class="required">*</span></label>
      <input type="email" id="email" placeholder="votre@email.com" autocomplete="email"/>
    </div>

    <div class="form-group">
      <label>Numéro de téléphone</label>
      <input type="tel" id="phone" placeholder="Ex: 0555 123 456" autocomplete="tel"/>
      <div class="hint">Optionnel — utile pour recevoir vos attestations par SMS</div>
    </div>

    <div class="form-group">
      <label>Wilaya de résidence <span class="required">*</span></label>
      <select id="wilaya">
        <option value="">Sélectionnez votre wilaya</option>
        <option>Adrar</option><option>Chlef</option><option>Laghouat</option>
        <option>Oum El Bouaghi</option><option>Batna</option><option>Béjaïa</option>
        <option>Biskra</option><option>Béchar</option><option>Blida</option>
        <option>Bouira</option><option>Tamanrasset</option><option>Tébessa</option>
        <option>Tlemcen</option><option>Tiaret</option><option>Tizi Ouzou</option>
        <option>Alger</option><option>Djelfa</option><option>Jijel</option>
        <option>Sétif</option><option>Saïda</option><option>Skikda</option>
        <option>Sidi Bel Abbès</option><option>Annaba</option><option>Guelma</option>
        <option>Constantine</option><option>Médéa</option><option>Mostaganem</option>
        <option>M'Sila</option><option>Mascara</option><option>Ouargla</option>
        <option>Oran</option><option>El Bayadh</option><option>Illizi</option>
        <option>Bordj Bou Arréridj</option><option>Boumerdès</option><option>El Tarf</option>
        <option>Tindouf</option><option>Tissemsilt</option><option>El Oued</option>
        <option>Khenchela</option><option>Souk Ahras</option><option>Tipaza</option>
        <option>Mila</option><option>Aïn Defla</option><option>Naâma</option>
        <option>Aïn Témouchent</option><option>Ghardaïa</option><option>Relizane</option>
      </select>
    </div>

    <!-- ── SECURITY ── -->
    <div class="section-label">Sécurité</div>

    <div class="form-group">
      <label>Mot de passe <span class="required">*</span></label>
      <input type="password" id="password" placeholder="Minimum 8 caractères" oninput="checkStrength(this.value)"/>
      <div class="pwd-strength">
        <div class="pwd-bar" id="bar1"></div>
        <div class="pwd-bar" id="bar2"></div>
        <div class="pwd-bar" id="bar3"></div>
        <div class="pwd-bar" id="bar4"></div>
      </div>
      <div class="pwd-label" id="pwdLabel">Entrez un mot de passe</div>
    </div>

    <div class="form-group">
      <label>Confirmer le mot de passe <span class="required">*</span></label>
      <input type="password" id="confirmPassword" placeholder="Répétez votre mot de passe"/>
    </div>

    <!-- Terms -->
    <div class="terms-row">
      <input type="checkbox" id="terms"/>
      <label for="terms">
        J'accepte les <a href="#">Conditions Générales d'Utilisation</a> et la
        <a href="#">Politique de Confidentialité</a> de CAAR. Je confirme avoir au moins 18 ans.
      </label>
    </div>

    <p class="error-msg" id="errorMsg"></p>

    <button class="btn-register" id="registerBtn" onclick="doRegister()">
      Créer mon compte
    </button>

    <div class="divider">ou</div>

    <a href="/login.html" class="btn-back">← Retour à la connexion</a>
  </div>

  <script>
    // Redirect if already logged in
    if (localStorage.getItem('token')) window.location.href = '/index.html';

    function selectGender(g) {
      document.getElementById('genderM').classList.toggle('selected', g === 'M');
      document.getElementById('genderF').classList.toggle('selected', g === 'F');
    }

    function checkStrength(pwd) {
      const bars  = [1,2,3,4].map(i => document.getElementById('bar' + i));
      const label = document.getElementById('pwdLabel');
      bars.forEach(b => { b.className = 'pwd-bar'; });

      if (!pwd) { label.textContent = 'Entrez un mot de passe'; return; }

      let score = 0;
      if (pwd.length >= 8)  score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;

      const levels = ['weak','weak','medium','strong'];
      const labels = ['Très faible','Faible','Moyen','Fort'];
      for (let i = 0; i < score; i++) bars[i].classList.add(levels[score - 1]);
      label.textContent = 'Force : ' + labels[score - 1];
    }

    async function doRegister() {
      const lastName   = document.getElementById('lastName').value.trim();
      const firstName  = document.getElementById('firstName').value.trim();
      const gender     = document.querySelector('input[name="gender"]:checked')?.value || '';
      const dobDay     = document.getElementById('dobDay').value;
      const dobMonth   = document.getElementById('dobMonth').value;
      const dobYear    = document.getElementById('dobYear').value;
      const email      = document.getElementById('email').value.trim();
      const phone      = document.getElementById('phone').value.trim();
      const wilaya     = document.getElementById('wilaya').value;
      const password   = document.getElementById('password').value;
      const confirm    = document.getElementById('confirmPassword').value;
      const terms      = document.getElementById('terms').checked;

      const errEl = document.getElementById('errorMsg');
      const btn   = document.getElementById('registerBtn');
      errEl.textContent = '';

      // ── Validation ──
      if (!firstName || !lastName)       { errEl.textContent = 'Veuillez entrer votre nom et prénom.'; return; }
      if (!gender)                        { errEl.textContent = 'Veuillez sélectionner votre genre.'; return; }
      if (!dobDay || !dobMonth || !dobYear) { errEl.textContent = 'Veuillez entrer votre date de naissance.'; return; }
      if (!email)                         { errEl.textContent = 'Veuillez entrer votre adresse e-mail.'; return; }
      if (!wilaya)                        { errEl.textContent = 'Veuillez sélectionner votre wilaya.'; return; }
      if (password.length < 8)            { errEl.textContent = 'Le mot de passe doit contenir au moins 8 caractères.'; return; }
      if (password !== confirm)           { errEl.textContent = 'Les mots de passe ne correspondent pas.'; return; }
      if (!terms)                         { errEl.textContent = 'Vous devez accepter les conditions d\'utilisation.'; return; }

      const name = `${firstName} ${lastName}`;
      const dateOfBirth = `${dobYear}-${dobMonth}-${String(dobDay).padStart(2,'0')}`;

      btn.disabled = true; btn.textContent = 'Création du compte...';

      try {
        const res  = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, gender, dateOfBirth, phone, wilaya })
        });
        const data = await res.json();

        if (!res.ok) { errEl.textContent = data.message || 'Erreur lors de la création.'; return; }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ Go directly to homepage after registration
        window.location.href = '/index.html';

      } catch(e) {
        errEl.textContent = 'Erreur serveur. Réessayez.';
      } finally {
        btn.disabled = false; btn.textContent = 'Créer mon compte';
      }
    }
  </script>

</body>
</html>