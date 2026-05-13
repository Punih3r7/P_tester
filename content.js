// PasswordShield v2.0 — content.js
// Injects a live strength badge on password fields in any webpage
(function(){
  'use strict';
  if (window.__psActive) return;
  window.__psActive = true;

  const css = `
    .ps-badge {
      position:absolute;right:8px;top:50%;transform:translateY(-50%);
      font-size:11px;font-weight:700;font-family:monospace;
      padding:2px 7px;border-radius:4px;pointer-events:none;
      z-index:999999;white-space:nowrap;transition:background .2s,color .2s;
    }
    .ps-0{background:#ff4560;color:#fff} .ps-1{background:#ff6b35;color:#fff}
    .ps-2{background:#ffb020;color:#000} .ps-3{background:#7ed321;color:#000}
    .ps-4{background:#00e676;color:#000}
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);

  const LABELS = ['Critically Weak','Weak','Fair','Strong','Very Strong'];
  function score(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 10) s += 20;
    if (pw.length >= 16) s += 10;
    if (/[A-Z]/.test(pw)) s += 15;
    if (/[a-z]/.test(pw)) s += 10;
    if (/[0-9]/.test(pw)) s += 15;
    if (/[^a-zA-Z0-9]/.test(pw)) s += 20;
    if (!/(.)\1{2,}/.test(pw)) s += 5;
    if (!/(123|abc|qwerty)/i.test(pw)) s += 5;
    return Math.min(100, s);
  }
  function lvl(s){ return s<20?0:s<40?1:s<60?2:s<80?3:4; }

  function attach(inp) {
    if (inp.dataset.psOk) return;
    inp.dataset.psOk = '1';
    const badge = document.createElement('div');
    badge.className = 'ps-badge';
    badge.style.display = 'none';
    const par = inp.parentElement;
    if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    par.appendChild(badge);
    inp.addEventListener('input', () => {
      const pw = inp.value;
      if (!pw) { badge.style.display = 'none'; inp.style.paddingRight = ''; return; }
      const l = lvl(score(pw));
      badge.className = 'ps-badge ps-' + l;
      badge.textContent = LABELS[l];
      badge.style.display = 'block';
      inp.style.paddingRight = '120px';
    });
  }

  document.querySelectorAll('input[type=password]').forEach(attach);
  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType!==1) continue;
      if (n.matches('input[type=password]')) attach(n);
      n.querySelectorAll?.('input[type=password]').forEach(attach);
    }
  }).observe(document.body, {childList:true, subtree:true});
})();
