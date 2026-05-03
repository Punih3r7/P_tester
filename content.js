// ─────────────────────────────────────────────
//  PasswordShield — content.js
//  Scans the active page for password fields
//  and injects a strength indicator badge.
// ─────────────────────────────────────────────

(function () {
  'use strict';

  // Avoid injecting twice
  if (window.__passwordShieldActive) return;
  window.__passwordShieldActive = true;

  const STYLE = `
    .ps-indicator {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      padding: 2px 7px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 999999;
      letter-spacing: 0.05em;
      white-space: nowrap;
      transition: background 0.2s, color 0.2s;
    }
    .ps-wrap { position: relative; display: inline-block; }
    .ps-score-0 { background: #ff4560; color: #fff; }
    .ps-score-1 { background: #ff6b35; color: #fff; }
    .ps-score-2 { background: #ffb020; color: #000; }
    .ps-score-3 { background: #7ed321; color: #000; }
    .ps-score-4 { background: #00e676; color: #000; }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  function getLevel(score) {
    if (score < 20) return 0;
    if (score < 40) return 1;
    if (score < 60) return 2;
    if (score < 80) return 3;
    return 4;
  }

  const LABELS = ['Critically Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  function quickScore(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 10) score += 20;
    if (pw.length >= 16) score += 10;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[a-z]/.test(pw)) score += 10;
    if (/[0-9]/.test(pw)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 20;
    if (!/(.)\1{2,}/.test(pw)) score += 5;
    if (!(/(123|abc|qwerty)/i.test(pw))) score += 5;
    return Math.min(100, score);
  }

  function attachIndicator(input) {
    // Don't double-attach
    if (input.dataset.psAttached) return;
    input.dataset.psAttached = '1';

    const indicator = document.createElement('div');
    indicator.className = 'ps-indicator';
    indicator.style.display = 'none';

    // Wrap the input if not already positioned
    const parent = input.parentElement;
    const originalStyle = getComputedStyle(parent).position;

    if (originalStyle === 'static') {
      parent.style.position = 'relative';
    }

    parent.appendChild(indicator);

    input.addEventListener('input', () => {
      const pw = input.value;
      if (!pw) {
        indicator.style.display = 'none';
        return;
      }

      const score = quickScore(pw);
      const lvl = getLevel(score);
      indicator.className = `ps-indicator ps-score-${lvl}`;
      indicator.textContent = LABELS[lvl];
      indicator.style.display = 'block';

      // Pad input so text doesn't hide behind badge
      input.style.paddingRight = '120px';
    });
  }

  // Attach to all existing password fields
  document.querySelectorAll('input[type="password"]').forEach(attachIndicator);

  // Watch for dynamically added fields (SPAs, etc.)
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches('input[type="password"]')) attachIndicator(node);
        node.querySelectorAll?.('input[type="password"]').forEach(attachIndicator);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
