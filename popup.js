// PasswordShield v2.0 — popup.js

// Nav tab switching
document.querySelectorAll('.ntab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ════════════════════════════════════════
//  TAB 1 — PASSWORD ANALYZER
// ════════════════════════════════════════

const pwInput    = document.getElementById('pwInput');
const eyeBtn     = document.getElementById('eyeBtn');
const emptyState = document.getElementById('emptyState');
const pwResults  = document.getElementById('pwResults');
const ringFill   = document.getElementById('ringFill');
const ringNum    = document.getElementById('ringNum');
const sTitle     = document.getElementById('sTitle');
const sSub       = document.getElementById('sSub');
const sBadges    = document.getElementById('sBadges');
const chkRows    = document.getElementById('chkRows');
const tipBox     = document.getElementById('tipBox');
const hibpBtn    = document.getElementById('hibpBtn');
const hibpRes    = document.getElementById('hibpRes');

const CIRCUMFERENCE = 2 * Math.PI * 25;

eyeBtn.addEventListener('click', () => {
  const hidden = pwInput.type === 'password';
  pwInput.type = hidden ? 'text' : 'password';
  eyeBtn.textContent = hidden ? '🙈' : '👁';
});

// 7 regex rules with weights
const RULES = [
  { id:'len',    label:'Length 10–128 chars',       weight:20, test: p => p.length >= 10 && p.length <= 128, detail: p => p.length + ' chars' },
  { id:'upper',  label:'Uppercase letter (A–Z)',    weight:15, test: p => /[A-Z]/.test(p) },
  { id:'lower',  label:'Lowercase letter (a–z)',    weight:10, test: p => /[a-z]/.test(p) },
  { id:'digit',  label:'Digit (0–9)',               weight:15, test: p => /[0-9]/.test(p) },
  { id:'spec',   label:'Special character (!@#$…)', weight:20, test: p => /[^a-zA-Z0-9]/.test(p) },
  { id:'repeat', label:'No repeated chars (aaa…)',  weight:10, test: p => !/(.)\1{2,}/.test(p) },
  { id:'seq',    label:'No keyboard sequences',     weight:10, test: p => !/(123|234|345|456|qwerty|asdf|abcd)/i.test(p) },
];

const LEVELS = [
  { min:0,  max:19,  title:'Critically Weak', sub:'Crackable in seconds',        cls:'l0', color:'#ff4560' },
  { min:20, max:39,  title:'Weak',            sub:'Brute-force vulnerable',       cls:'l1', color:'#ff6b35' },
  { min:40, max:59,  title:'Fair',            sub:'Needs improvement',            cls:'l2', color:'#ffb020' },
  { min:60, max:79,  title:'Strong',          sub:'Good — consider going longer', cls:'l3', color:'#7ed321' },
  { min:80, max:100, title:'Very Strong',     sub:'Excellent security posture',   cls:'l4', color:'#00e676' },
];
function getLevel(s) { return LEVELS.find(l => s >= l.min && s <= l.max) || LEVELS[0]; }

const TIPS = {
  len:    '💡 <strong>Tip:</strong> Use 16+ characters — length beats complexity every time.',
  upper:  '💡 <strong>Tip:</strong> Add uppercase letters scattered throughout, not just at the start.',
  lower:  '💡 <strong>Tip:</strong> Mix lowercase letters for greater entropy.',
  digit:  '💡 <strong>Tip:</strong> Insert numbers in the middle of words, not just at the end.',
  spec:   '💡 <strong>Tip:</strong> Add a special char like ! @ # $ & * to massively increase entropy.',
  repeat: '💡 <strong>Tip:</strong> Avoid repeating the same character 3+ times in a row.',
  seq:    '💡 <strong>Tip:</strong> Keyboard patterns like qwerty/123 are in every cracker\'s dictionary.',
  good:   '✅ <strong>Excellent!</strong> Store this in a password manager like Bitwarden.',
};

function renderPW(pw) {
  if (!pw) {
    emptyState.classList.remove('hidden');
    pwResults.classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  pwResults.classList.remove('hidden');

  const results = RULES.map(r => ({ ...r, pass: r.test(pw), det: r.detail ? r.detail(pw) : '' }));
  const total = Math.min(100, Math.round(
    (results.reduce((s, r) => s + (r.pass ? r.weight : 0), 0) / 100) * 100
  ));
  const lvl = getLevel(total);

  // Score ring
  ringFill.style.strokeDashoffset = CIRCUMFERENCE - (total / 100) * CIRCUMFERENCE;
  ringFill.style.stroke = lvl.color;
  ringNum.textContent = total;

  // Title
  sTitle.textContent = lvl.title;
  sTitle.className = 's-title ' + lvl.cls;
  sSub.textContent = lvl.sub;

  // Badge
  const pc = results.filter(r => r.pass).length;
  sBadges.innerHTML = `<span class="bdg ${pc === RULES.length ? 'bp' : pc >= 5 ? 'bw' : 'bf'}">${pc}/${RULES.length} rules passed</span>`;

  // Check rows
  chkRows.innerHTML = results.map(r =>
    `<div class="chk-row">
      <div class="chk-ico ${r.pass ? 'p' : 'f'}">${r.pass ? '✓' : '✗'}</div>
      <span class="chk-lbl">${r.label}</span>
      ${r.det ? `<span class="chk-val">${r.det}</span>` : ''}
    </div>`
  ).join('');

  // Tip
  const firstFail = results.find(r => !r.pass);
  tipBox.innerHTML = '<strong>💡 Tip</strong><br>' + (firstFail ? TIPS[firstFail.id] : TIPS.good);

  hibpRes.className = 'hibp-res hidden';
  hibpRes.textContent = '';
}

pwInput.addEventListener('input', () => renderPW(pwInput.value));

// HIBP k-anonymity breach check
hibpBtn.addEventListener('click', async () => {
  const pw = pwInput.value;
  if (!pw) return;
  hibpRes.className = 'hibp-res checking';
  hibpRes.textContent = 'Checking…';
  hibpRes.classList.remove('hidden');
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } });
    const txt = await res.text();
    const match = txt.split('\n').find(l => l.startsWith(hex.slice(5)));
    if (match) {
      const n = parseInt(match.split(':')[1]);
      hibpRes.className = 'hibp-res breached';
      hibpRes.textContent = `🔥 Breached ${n.toLocaleString()}×`;
    } else {
      hibpRes.className = 'hibp-res safe';
      hibpRes.textContent = '✅ Not in breaches';
    }
  } catch (e) {
    hibpRes.className = 'hibp-res';
    hibpRes.style.color = 'var(--warn)';
    hibpRes.textContent = '⚠ Check failed';
  }
});

// ════════════════════════════════════════
//  TAB 2 — REGEX VALIDATOR
// ════════════════════════════════════════

const PATTERNS = {
  email: {
    re: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
    display: '/^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$/',
    pass: '✓ Valid email address',
    fail: '✗ Invalid — needs local@domain.tld format',
    examples: ['user@gmail.com', 'a+b@sub.org', 'bad@.com', 'no-at-sign'],
    parts: [
      ['^',                    'Start anchor — nothing allowed before this pattern'],
      ['[a-zA-Z0-9._%+\\-]+', 'Local part — letters, digits, dots, underscores, +, % and hyphen (1 or more)'],
      ['@',                    'Literal @ symbol — required separator between local and domain'],
      ['[a-zA-Z0-9.\\-]+',    'Domain name — letters, digits, dots, hyphens (1 or more chars)'],
      ['\\.',                  'Literal dot before TLD — escaped because unescaped . means "any char"'],
      ['[a-zA-Z]{2,}',        'Top-level domain — at least 2 letters (com, org, io, museum…)'],
      ['$',                    'End anchor — nothing allowed after the pattern'],
    ]
  },
  phone: {
    re: /^(\+?[0-9]{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4,6}$/,
    display: '/^(\\+?[0-9]{1,3}[\\s\\-]?)?(\\(?\\d{3}\\)?[\\s\\-]?)?\\d{3}[\\s\\-]?\\d{4,6}$/',
    pass: '✓ Valid phone number',
    fail: '✗ Invalid — must be 10–13 digits, optional country code',
    examples: ['+8801712345678', '01812345678', '+1-800-555-0199', '123'],
    parts: [
      ['^',                         'Start anchor'],
      ['(\\+?[0-9]{1,3}[\\s\\-]?)?','Optional country code — + sign optional, 1–3 digits (e.g. +880, +1), optional space/hyphen'],
      ['(\\(?\\d{3}\\)?[\\s\\-]?)?','Optional area code — parentheses optional around 3 digits, optional separator'],
      ['\\d{3}[\\s\\-]?',           'First 3 subscriber digits, optional separator'],
      ['\\d{4,6}',                  'Last 4–6 digits — handles BD 11-digit local and international formats'],
      ['$',                         'End anchor'],
    ]
  },
  password: {
    re: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/,
    display: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$/',
    pass: '✓ Strong password — all requirements met',
    fail: '✗ Weak — needs uppercase, lowercase, digit, special char, min 8 chars',
    examples: ['Secure@123', 'P@ssw0rd!', 'weakpass', 'NoSpecial1'],
    parts: [
      ['^',               'Start anchor'],
      ['(?=.*[a-z])',     'Lookahead — scans ahead to confirm at least one lowercase letter exists anywhere'],
      ['(?=.*[A-Z])',     'Lookahead — confirms at least one uppercase letter exists anywhere'],
      ['(?=.*\\d)',       'Lookahead — confirms at least one digit (0–9) exists anywhere'],
      ['(?=.*[!@#$…])',  'Lookahead — confirms at least one special character exists anywhere'],
      ['[A-Za-z\\d…]{8,}','Actual match — only allowed characters, minimum 8 length. All 4 lookaheads must pass first'],
      ['$',               'End anchor — no extra characters allowed after'],
    ]
  },
  username: {
    re: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
    display: '/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/',
    pass: '✓ Valid username',
    fail: '✗ Invalid — start with letter, 3–20 chars, only letters/digits/underscore',
    examples: ['assad_dev', 'Valid123', 'ab', '_startunder'],
    parts: [
      ['^',           'Start anchor'],
      ['[a-zA-Z]',    'First character MUST be a letter — no leading digits or underscores allowed'],
      ['[a-zA-Z0-9_]','Remaining characters — letters, digits, or underscore only'],
      ['{2,19}',      '2 to 19 more characters after the first = total length 3 to 20'],
      ['$',           'End anchor'],
    ]
  },
  date: {
    re: /^(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-]\d{4}$|^\d{4}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])$/,
    display: '/^(0[1-9]|[12]\\d|3[01])[\\/\\-](0[1-9]|1[0-2])[\\/\\-]\\d{4}$|^\\d{4}[\\/\\-](0[1-9]|1[0-2])[\\/\\-](0[1-9]|[12]\\d|3[01])$/',
    pass: '✓ Valid date format',
    fail: '✗ Invalid — use DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD',
    examples: ['25/12/2024', '2024-01-15', '01-06-2025', '32/13/2024'],
    parts: [
      ['(0[1-9]|[12]\\d|3[01])', 'Day — 01–09 OR 10–29 OR 30–31. Prevents 00 and 32+'],
      ['[\\/\\-]',               'Separator — accepts / or - as delimiter'],
      ['(0[1-9]|1[0-2])',        'Month — 01–09 OR 10–12. Prevents 00 and 13+'],
      ['\\d{4}',                 'Year — exactly 4 digits'],
      ['|',                      'Alternation — the right side handles ISO format YYYY-MM-DD'],
      ['^\\d{4}[\\/\\-]…',      'Second branch — year first, then month, then day (ISO 8601)'],
    ]
  },
  time: {
    re: /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$|^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i,
    display: '/^([01]\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$|^(0?[1-9]|1[0-2]):[0-5]\\d\\s?(AM|PM)$/i',
    pass: '✓ Valid time format',
    fail: '✗ Invalid — use HH:MM, HH:MM:SS (24h) or H:MM AM/PM (12h)',
    examples: ['14:30', '09:05:59', '12:30 PM', '25:61'],
    parts: [
      ['([01]\\d|2[0-3])', '24h hour — 00–09 or 10–19 or 20–23. Blocks 24–29'],
      [':',                'Literal colon separator'],
      ['([0-5]\\d)',       'Minutes — first digit 0–5, second 0–9. Blocks 60–99'],
      ['(:[0-5]\\d)?',    'Optional seconds — same constraint as minutes'],
      ['|',               'Alternation — second branch handles 12-hour clock format'],
      ['(0?[1-9]|1[0-2])','12h hour — 1–9 with optional leading zero, or 10–12'],
      ['\\s?(AM|PM)',      'Optional space then AM or PM'],
      ['/i flag',         'Case-insensitive — accepts am, pm, Am, PM etc.'],
    ]
  },
};

let currentPattern = 'email';

function initRegexTab() {
  renderExamples('email');
  renderResult('');

  document.getElementById('rxChips').addEventListener('click', e => {
    const chip = e.target.closest('.rx-chip');
    if (!chip) return;
    currentPattern = chip.dataset.p;
    document.querySelectorAll('.rx-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    document.getElementById('rxInput').value = '';
    renderExamples(currentPattern);
    renderResult('');
  });

  document.getElementById('rxInput').addEventListener('input', e => {
    renderResult(e.target.value);
  });
}

function renderExamples(pat) {
  const wrap = document.getElementById('rxExamples');
  wrap.innerHTML = PATTERNS[pat].examples.map(ex =>
    `<span class="rx-ex" data-val="${ex}">${ex}</span>`
  ).join('');
  wrap.querySelectorAll('.rx-ex').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('rxInput').value = el.dataset.val;
      renderResult(el.dataset.val);
    });
  });
}

function renderResult(val) {
  const p = PATTERNS[currentPattern];
  const dot     = document.getElementById('rxDot');
  const verdict = document.getElementById('rxVerdict');
  const regexEl = document.getElementById('rxRegex');
  const partsEl = document.getElementById('rxParts');
  const chip    = document.querySelector(`.rx-chip[data-p="${currentPattern}"]`);

  regexEl.textContent = p.display;
  partsEl.innerHTML = p.parts.map(([tok, desc]) =>
    `<div class="rx-part"><span class="rx-tok">${tok}</span><span class="rx-desc">${desc}</span></div>`
  ).join('');

  if (!val) {
    dot.className = 'rx-status-dot';
    verdict.className = 'rx-verdict';
    verdict.textContent = 'Type a value above to validate';
    if (chip) chip.className = 'rx-chip active';
    return;
  }

  const ok = p.re.test(val);
  dot.className = 'rx-status-dot ' + (ok ? 'p' : 'f');
  verdict.className = 'rx-verdict ' + (ok ? 'p' : 'f');
  verdict.textContent = ok ? p.pass : p.fail;
  if (chip) chip.className = `rx-chip active ${ok ? 'vpass' : 'vfail'}`;
}

initRegexTab();
