// ─────────────────────────────────────────────
//  PasswordShield — popup.js
//  Phase 1: Regex rules  |  Phase 2: ML score
// ─────────────────────────────────────────────

// ── DOM refs ──
const pwInput    = document.getElementById('pwInput');
const toggleVis  = document.getElementById('toggleVis');
const emptyState = document.getElementById('emptyState');
const results    = document.getElementById('results');

const ringFill   = document.getElementById('ringFill');
const ringScore  = document.getElementById('ringScore');
const scoreTitle = document.getElementById('scoreTitle');
const scoreSub   = document.getElementById('scoreSubtitle');
const scoreBadges= document.getElementById('scoreBadges');
const checkRows  = document.getElementById('checkRows');

const mlPct      = document.getElementById('mlPct');
const mlBar      = document.getElementById('mlBar');
const mlVerdict  = document.getElementById('mlVerdict');
const tipBox     = document.getElementById('tipBox');

const hibpBtn    = document.getElementById('hibpBtn');
const hibpResult = document.getElementById('hibpResult');

// ── Constants ──
const RING_CIRCUMFERENCE = 2 * Math.PI * 25; // 157

// ── Toggle visibility ──
toggleVis.addEventListener('click', () => {
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';
  toggleVis.textContent = isHidden ? '🙈' : '👁';
});

// ── Regex Rules ──
const RULES = [
  {
    id: 'length',
    label: 'Length (10–128 chars)',
    test: pw => pw.length >= 10 && pw.length <= 128,
    detail: pw => `${pw.length} chars`,
    tip: 'Use at least 10 characters — longer is stronger.',
    weight: 20,
  },
  {
    id: 'uppercase',
    label: 'Uppercase letter (A–Z)',
    test: pw => /[A-Z]/.test(pw),
    detail: () => '',
    tip: 'Add at least one uppercase letter.',
    weight: 15,
  },
  {
    id: 'lowercase',
    label: 'Lowercase letter (a–z)',
    test: pw => /[a-z]/.test(pw),
    detail: () => '',
    tip: 'Include lowercase letters for variety.',
    weight: 10,
  },
  {
    id: 'number',
    label: 'Number (0–9)',
    test: pw => /[0-9]/.test(pw),
    detail: () => '',
    tip: 'Add at least one number.',
    weight: 15,
  },
  {
    id: 'special',
    label: 'Special character (!@#$&*…)',
    test: pw => /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
    detail: () => '',
    tip: 'Add a special character like ! @ # $ & *',
    weight: 20,
  },
  {
    id: 'noRepeat',
    label: 'No excessive repetition',
    test: pw => !/(.)\1{2,}/.test(pw),
    detail: () => '',
    tip: 'Avoid repeating the same character 3+ times in a row.',
    weight: 10,
  },
  {
    id: 'noSequence',
    label: 'No common sequences',
    test: pw => !/(123|234|345|456|567|678|789|890|abc|bcd|cde|qwerty|asdf)/i.test(pw),
    detail: () => '',
    tip: 'Avoid keyboard sequences like "123" or "qwerty".',
    weight: 10,
  },
];

// ── Common pattern list (simulates ML breach check) ──
// In production this comes from your trained model; here we use a heuristic.
const COMMON_PATTERNS = [
  /^password/i, /^123456/, /^qwerty/i, /^abc123/i,
  /^letmein/i, /^welcome/i, /^monkey/i, /^dragon/i,
  /^master/i,  /^login/i,  /^pass/i,   /^admin/i,
  /^iloveyou/i,/^sunshine/i,/^princess/i,/^football/i,
  /^shadow/i,  /^superman/i,/^michael/i, /^batman/i,
];

// ── ML-style heuristic score (0–100 risk) ──
// This runs until you wire in the real TensorFlow.js model.
function mlRiskScore(pw) {
  let risk = 0;

  // Common pattern match
  for (const re of COMMON_PATTERNS) {
    if (re.test(pw)) { risk += 50; break; }
  }

  // Low entropy: mostly one character class
  const hasOnly = (re) => [...pw].every(c => re.test(c));
  if (hasOnly(/[a-z]/)) risk += 30;
  if (hasOnly(/[0-9]/)) risk += 30;

  // Short length
  if (pw.length < 8)  risk += 40;
  if (pw.length < 12) risk += 15;

  // Entropy bonus (reduces risk)
  const charset = (
    (/[a-z]/.test(pw) ? 26 : 0) +
    (/[A-Z]/.test(pw) ? 26 : 0) +
    (/[0-9]/.test(pw) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 32 : 0)
  );
  const entropy = pw.length * Math.log2(charset || 1);
  risk -= Math.min(40, entropy / 3);

  return Math.max(0, Math.min(100, Math.round(risk)));
}

// ── Levels ──
const LEVELS = [
  { min: 0,  max: 19,  title: 'Critically Weak',    sub: 'Crackable in seconds',       cls: 'lvl-0', color: '#ff4560' },
  { min: 20, max: 39,  title: 'Weak',               sub: 'Brute-force vulnerable',      cls: 'lvl-1', color: '#ff6b35' },
  { min: 40, max: 59,  title: 'Fair',               sub: 'Needs improvement',           cls: 'lvl-2', color: '#ffb020' },
  { min: 60, max: 79,  title: 'Strong',             sub: 'Good — consider longer',      cls: 'lvl-3', color: '#7ed321' },
  { min: 80, max: 100, title: 'Very Strong',        sub: 'Excellent security posture',  cls: 'lvl-4', color: '#00e676' },
];

function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];
}

// ── Tips pool ──
const TIPS = {
  length:    '💡 <strong>Tip:</strong> Aim for 16+ characters. Length beats complexity every time.',
  uppercase: '💡 <strong>Tip:</strong> Mix uppercase letters randomly — not just the first character.',
  number:    '💡 <strong>Tip:</strong> Insert numbers in the middle of words, not just at the end.',
  special:   '💡 <strong>Tip:</strong> Special characters like $ or @ dramatically increase entropy.',
  noRepeat:  '💡 <strong>Tip:</strong> Avoid repeating characters, e.g. "aaa" or "111".',
  noSequence:'💡 <strong>Tip:</strong> Keyboard walks (qwerty, 12345) are in every cracker\'s dictionary.',
  mlHigh:    '⚠️ <strong>ML Alert:</strong> This pattern appears in breach databases. Change it now.',
  good:      '✅ <strong>Great password!</strong> Store it in a password manager like Bitwarden.',
};

function getFirstFailTip(results) {
  for (const r of results) {
    if (!r.pass && TIPS[r.id]) return TIPS[r.id];
  }
  return null;
}

// ── Render ──
function render(pw) {
  if (!pw) {
    emptyState.classList.remove('hidden');
    results.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  results.classList.remove('hidden');
  results.classList.add('fade-in');

  // ── Phase 1: Regex checks ──
  const ruleResults = RULES.map(r => ({
    ...r,
    pass: r.test(pw),
    detailStr: r.detail(pw),
  }));

  const regexScore = ruleResults.reduce((sum, r) => sum + (r.pass ? r.weight : 0), 0);
  // normalize to 0-70 (30 points reserved for ML)
  const regexNorm = Math.round((regexScore / 100) * 70);

  // ── Phase 2: ML heuristic ──
  const risk = mlRiskScore(pw);
  const mlScore = Math.round((1 - risk / 100) * 30);

  const totalScore = Math.min(100, regexNorm + mlScore);
  const level = getLevel(totalScore);

  // Ring
  const offset = RING_CIRCUMFERENCE - (totalScore / 100) * RING_CIRCUMFERENCE;
  ringFill.style.strokeDashoffset = offset;
  ringFill.style.stroke = level.color;
  ringScore.textContent = totalScore;

  // Title
  scoreTitle.textContent = level.title;
  scoreTitle.className = `score-title ${level.cls}`;
  scoreSub.textContent = level.sub;

  // Badges
  const passCount = ruleResults.filter(r => r.pass).length;
  scoreBadges.innerHTML = `
    <span class="badge ${passCount === RULES.length ? 'badge-pass' : passCount >= 5 ? 'badge-warn' : 'badge-fail'}">
      ${passCount}/${RULES.length} rules
    </span>
    <span class="badge ${risk < 30 ? 'badge-pass' : risk < 60 ? 'badge-warn' : 'badge-fail'}">
      ML Risk: ${risk < 30 ? 'Low' : risk < 60 ? 'Medium' : 'High'}
    </span>
  `;

  // Check rows
  checkRows.innerHTML = ruleResults.map(r => `
    <div class="check-row">
      <div class="check-icon ${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✗'}</div>
      <span class="check-label">${r.label}</span>
      ${r.detailStr ? `<span class="check-value">${r.detailStr}</span>` : ''}
    </div>
  `).join('');

  // ML panel
  mlPct.textContent = `${risk}% risk`;
  mlBar.style.width = `${risk}%`;
  mlBar.style.background = risk < 30
    ? 'linear-gradient(90deg, #00e676, #7ed321)'
    : risk < 60
    ? 'linear-gradient(90deg, #ffb020, #ff6b35)'
    : 'linear-gradient(90deg, #ff4560, #7b2fff)';

  if (risk < 30) {
    mlVerdict.innerHTML = `<strong>Low predictability.</strong> Pattern not found in common breach signatures.`;
  } else if (risk < 60) {
    mlVerdict.innerHTML = `<strong>Medium risk.</strong> Some elements match patterns seen in leaked password lists.`;
  } else {
    mlVerdict.innerHTML = `<strong>⚠ High risk.</strong> This pattern is common in breach databases. Avoid using it.`;
  }

  // Tip
  const failTip = getFirstFailTip(ruleResults);
  const mlTip   = risk >= 60 ? TIPS.mlHigh : null;
  tipBox.innerHTML = `<strong>💡 Tip</strong><br>${mlTip || failTip || TIPS.good}`;

  // Reset HIBP on new input
  hibpResult.className = 'hibp-result hidden';
  hibpResult.textContent = '';
}

// ── Input listener ──
pwInput.addEventListener('input', () => render(pwInput.value));

// ── HIBP Check (k-anonymity) ──
hibpBtn.addEventListener('click', async () => {
  const pw = pwInput.value;
  if (!pw) return;

  hibpResult.className = 'hibp-result checking';
  hibpResult.textContent = 'Checking…';
  hibpResult.classList.remove('hidden');

  try {
    // SHA-1 hash using Web Crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(pw);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' }
    });

    if (!response.ok) throw new Error('API error');

    const text = await response.text();
    const lines = text.split('\n');
    const match = lines.find(l => l.startsWith(suffix));

    if (match) {
      const count = parseInt(match.split(':')[1].trim(), 10);
      hibpResult.className = 'hibp-result breached';
      hibpResult.textContent = `🔥 Breached ${count.toLocaleString()}×`;
    } else {
      hibpResult.className = 'hibp-result safe';
      hibpResult.textContent = '✅ Not breached';
    }
  } catch (e) {
    hibpResult.className = 'hibp-result warn';
    hibpResult.textContent = '⚠ Check failed';
    console.error('HIBP error:', e);
  }
});
