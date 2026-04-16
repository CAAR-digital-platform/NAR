/* ============================================================
   CAAR - profile-api.js
   Profile update - PUT /api/auth/profile
   ============================================================ */
'use strict';

async function saveProfileAPI() {
  var first = ((document.getElementById('pf-first') || {}).value || '').trim();
  var last  = ((document.getElementById('pf-last')  || {}).value || '').trim();
  var email = ((document.getElementById('pf-email') || {}).value || '').trim();
  var phone = ((document.getElementById('pf-phone') || {}).value || '').trim();
  var okEl  = document.getElementById('pfb-success');

  if (!first || !last) {
    showMsg('profileApiMsg', 'First name and last name are required.', true);
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('profileApiMsg', 'Please enter a valid email.', true);
    return;
  }

  var btn = document.querySelector('.pfb-btn-primary');
  btnLoading(btn, 'Saving...');

  var result = await apiRequest('/api/auth/profile', 'PUT', {
    first_name: first,
    last_name: last,
    email: email,
    phone: phone || null,
  });

  btnReset(btn);

  if (!result.ok) {
    showMsg(
      'profileApiMsg',
      (result.data && result.data.error) || 'Unable to update profile right now.',
      true
    );
    return;
  }

  if (result.data && result.data.user) {
    localStorage.setItem('user', JSON.stringify(result.data.user));
  }

  if (okEl) {
    okEl.style.display = 'flex';
    setTimeout(function () { okEl.style.display = 'none'; }, 3000);
  }

  showMsg('profileApiMsg', 'Profile updated.', false);
  setTimeout(function () { hideMsg('profileApiMsg'); }, 3000);
}

async function changePasswordAPI() {
  var current = ((document.getElementById('pf-pw-current') || {}).value || '');
  var pw1     = ((document.getElementById('pf-pw-new')     || {}).value || '');
  var pw2     = ((document.getElementById('pf-pw-confirm') || {}).value || '');
  var errEl   = document.getElementById('pfb-pw-error');
  var okEl    = document.getElementById('pfb-pw-success');
  var btn      = document.getElementById('pfPwBtn');

  if (!current) {
    showMsg('profileApiMsg', 'Please enter your current password.', true);
    return;
  }

  if (pw1.length < 8) {
    showMsg('profileApiMsg', 'New password must be at least 8 characters.', true);
    return;
  }

  if (pw1 !== pw2) {
    if (errEl) errEl.style.display = 'flex';
    setTimeout(function () { if (errEl) errEl.style.display = 'none'; }, 3000);
    return;
  }

  btnLoading(btn, 'Updating...');
  var result = await apiRequest('/api/auth/password', 'PUT', {
    current_password: current,
    new_password: pw1,
  });
  btnReset(btn);

  if (!result.ok) {
    showMsg('profileApiMsg', (result.data && result.data.error) || 'Unable to change password.', true);
    return;
  }

  if (okEl) {
    okEl.style.display = 'flex';
    setTimeout(function () { okEl.style.display = 'none'; }, 3000);
  }
  ['pf-pw-current', 'pf-pw-new', 'pf-pw-confirm'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.value = '';
  });
  showMsg('profileApiMsg', 'Password updated.', false);
  setTimeout(function () { hideMsg('profileApiMsg'); }, 3000);
}

window.saveProfile = saveProfileAPI;
window.changePassword = changePasswordAPI;
