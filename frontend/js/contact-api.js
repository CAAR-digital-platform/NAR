/* ============================================================
   CAAR — contact-api.js
   Connects the contact form to POST /api/messages
   Add to contact.html: <script src="contact-api.js"></script>
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('caarContactForm');
  if (!form) return;

  /* Override the existing submit handler in main.js */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    await submitContactAPI();
  });
});

async function submitContactAPI() {
  var subject = (document.getElementById('cfSubject') || {}).value || '';
  var name    = ((document.getElementById('cfName')    || {}).value || '').trim();
  var email   = ((document.getElementById('cfEmail')   || {}).value || '').trim();
  var phone   = ((document.getElementById('cfPhone')   || {}).value || '').trim();
  var message = ((document.getElementById('cfMessage') || {}).value || '').trim();
  var consent = (document.getElementById('cfConsent') || {}).checked;
  var robot   = (document.getElementById('cfRobot')   || {}).checked;

  /* Basic validation */
  if (!name || name.length < 3) {
    showMsg('contactApiMsg', 'Please enter your full name.', true); return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('contactApiMsg', 'Please enter a valid email address.', true); return;
  }
  if (!subject) {
    showMsg('contactApiMsg', 'Please select a subject.', true); return;
  }
  if (!message || message.length < 10) {
    showMsg('contactApiMsg', 'Message must be at least 10 characters.', true); return;
  }
  if (!consent) {
    showMsg('contactApiMsg', 'Please accept the data processing terms.', true); return;
  }
  if (!robot) {
    showMsg('contactApiMsg', 'Please confirm you are not a robot.', true); return;
  }

  var btn = document.getElementById('sendBtn');
  btnLoading(btn, 'Sending…');
  hideMsg('contactApiMsg');

  var result = await apiRequest('/api/messages', 'POST', {
    name: name,
    email: email,
    subject: subject,
    message: message
  });

  btnReset(btn);

  if (!result.ok) {
    showMsg('contactApiMsg', result.data.error || 'Failed to send message.', true);
    return;
  }

  /* Show success state */
  var ff = document.getElementById('formFields');
  var ss = document.getElementById('successState');
  if (ff) ff.style.display = 'none';
  if (ss) ss.classList.add('show');
}