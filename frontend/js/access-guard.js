/* ============================================================
   CAAR — access-guard.js

   Purpose:
   - Hard block protected product access for guests
   - Show a clear login/register guidance prompt
   - Preserve intended destination via returnTo
   ============================================================ */

'use strict';

(function () {
  function _isAuthenticated() {
    if (typeof window.isAuthenticated === 'function') {
      return window.isAuthenticated();
    }
    return !!localStorage.getItem('token');
  }

  function _buildLoginUrl(target, reason) {
    var url = 'login.html';
    var qp = [];
    if (target) qp.push('returnTo=' + encodeURIComponent(target));
    if (reason) qp.push('reason=' + encodeURIComponent(reason));
    if (qp.length) url += '?' + qp.join('&');
    return url;
  }

  function _removeExistingPrompt() {
    var old = document.getElementById('caar-auth-gate-overlay');
    if (old) old.remove();
  }

  function showPrompt(options) {
    options = options || {};
    var target = options.target || window.location.pathname.split('/').pop() || 'index.html';
    var reason = options.reason || 'auth_required';

    _removeExistingPrompt();

    var overlay = document.createElement('div');
    overlay.id = 'caar-auth-gate-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'background:rgba(20,20,20,.52)',
      'backdrop-filter:blur(3px)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:16px'
    ].join(';');

    var card = document.createElement('div');
    card.style.cssText = [
      'width:100%',
      'max-width:460px',
      'background:#fff',
      'border-radius:16px',
      'padding:22px 22px 18px',
      'box-shadow:0 24px 50px rgba(0,0,0,.22)',
      'border:1px solid #efe8df',
      'font-family:"DM Sans", system-ui, sans-serif'
    ].join(';');

    card.innerHTML = [
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">',
      '  <span style="font-size:1.28rem;line-height:1;">↗</span>',
      '  <h3 style="margin:0;font-size:1.08rem;color:#1f1f1f;">Login Required</h3>',
      '</div>',
      '<p style="margin:0 0 16px;color:#505050;font-size:.92rem;line-height:1.55;">',
      'To access CATNAT and Roadside subscription, please log in to your account first.',
      '</p>',
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">',
      '  <a id="caar-auth-login" href="' + _buildLoginUrl(target, reason) + '"',
      '     style="flex:1;min-width:170px;text-align:center;background:#E8761E;color:#fff;text-decoration:none;',
      '     border-radius:10px;padding:11px 14px;font-weight:700;font-size:.88rem;">Go to Login</a>',
      '  <a href="register.html"',
      '     style="flex:1;min-width:170px;text-align:center;background:#fff;color:#E8761E;text-decoration:none;',
      '     border:2px solid #E8761E;border-radius:10px;padding:9px 14px;font-weight:700;font-size:.88rem;">Create Account</a>',
      '</div>',
      '<button id="caar-auth-close" type="button"',
      '   style="margin-top:12px;background:none;border:none;color:#757575;cursor:pointer;font-size:.82rem;">Close</button>'
    ].join('');

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var close = document.getElementById('caar-auth-close');
    if (close) {
      close.addEventListener('click', function () {
        overlay.remove();
      });
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  function protectLinks(selectorOrArray, options) {
    options = options || {};
    var selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];

    selectors.forEach(function (selector) {
      var links = document.querySelectorAll(selector);
      links.forEach(function (a) {
        a.addEventListener('click', function (e) {
          if (_isAuthenticated()) return;

          e.preventDefault();
          e.stopPropagation();
          var target = a.getAttribute('href') || 'index.html';
          showPrompt({ target: target, reason: options.reason || 'auth_required' });
        });
      });
    });
  }

  function guardPage(options) {
    options = options || {};
    if (_isAuthenticated()) return true;

    var target = options.target || window.location.pathname.split('/').pop();
    showPrompt({ target: target, reason: options.reason || 'auth_required' });

    if (options.autoRedirect) {
      window.location.href = _buildLoginUrl(target, options.reason || 'auth_required');
    }

    return false;
  }

  window.CAARAccessGate = {
    protectLinks: protectLinks,
    guardPage: guardPage,
    showPrompt: showPrompt,
    buildLoginUrl: _buildLoginUrl,
  };
})();
