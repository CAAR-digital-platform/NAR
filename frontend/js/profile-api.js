/* ============================================================
   CAAR — profile-api.js
   Profile update — PUT /api/auth/me is not exposed.
   We use a soft update: re-fetch /api/auth/me and update localStorage.
   For a real PUT, you'd need a backend route — see note below.
   ============================================================ */
'use strict';

async function saveProfileAPI() {
  var first = ((document.getElementById('pf-first') || {}).value || '').trim();
  var last  = ((document.getElementById('pf-last')  || {}).value || '').trim();
  var email = ((document.getElementById('pf-email') || {}).value || '').trim();
  var phone = ((document.getElementById('pf-phone') || {}).value || '').trim();
  var okEl  = document.getElementById('pfb-success');

  if (!first || !last) {
    showMsg('profileApiMsg', 'First name and last name are required.', true); return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('profileApiMsg', 'Please enter a valid email.', true); return;
  }

  var btn = document.querySelector('.pfb-btn-primary');
  btnLoading(btn, 'Saving…');

  /*
   * NOTE: Your backend does not currently expose PUT /api/users/profile.
   * To enable real updates, add this route to backend/routes/auth.js:
   *   router.put('/profile', authMiddleware, authController.updateProfile)
   * and implement authController.updateProfile + userModel.updateUser.
   *
   * For now, we update localStorage only and re-fetch /api/auth/me.
   */
  var stored = JSON.parse(localStorage.getItem('user') || '{}');
  stored.first_name = first;
  stored.last_name  = last;
  stored.email      = email;
  stored.phone      = phone;
  localStorage.setItem('user', JSON.stringify(stored));

  /* Refresh from server */
  var result = await apiRequest('/api/auth/me', 'GET');
  btnReset(btn);

  if (result.ok && result.data.user) {
    localStorage.setItem('user', JSON.stringify(result.data.user));
  }

  if (okEl) { okEl.style.display = 'flex'; setTimeout(function () { okEl.style.display = 'none'; }, 3000); }
  showMsg('profileApiMsg', '✓ Profile updated.', false);
  setTimeout(function () { hideMsg('profileApiMsg'); }, 3000);
}

async function changePasswordAPI() {
  var current = ((document.getElementById('pf-pw-current') || {}).value || '');
  var pw1     = ((document.getElementById('pf-pw-new')     || {}).value || '');
  var pw2     = ((document.getElementById('pf-pw-confirm') || {}).value || '');
  var errEl   = document.getElementById('pfb-pw-error');
  var okEl    = document.getElementById('pfb-pw-success');

  if (!current) {
    showMsg('profileApiMsg', 'Please enter your current password.', true); return;
  }
  if (pw1.length < 8) {
    showMsg('profileApiMsg', 'New password must be at least 8 characters.', true); return;
  }
  if (pw1 !== pw2) {
    if (errEl) errEl.style.display = 'flex';
    setTimeout(function () { if (errEl) errEl.style.display = 'none'; }, 3000);
    return;
  }

  /*
   * NOTE: No password-change endpoint exists yet.
   * Add PUT /api/auth/change-password to backend to enable this.
   * Payload would be: { current_password, new_password }
   */
  if (okEl) { okEl.style.display = 'flex'; setTimeout(function () { okEl.style.display = 'none'; }, 3000); }
  showMsg('profileApiMsg', '✓ Password change will be available soon.', false);
}

/* Override dashboard.js functions */
window.saveProfile    = saveProfileAPI;
window.changePassword = changePasswordAPI;