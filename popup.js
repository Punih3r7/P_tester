// ═══════════════════════════════════════════════════════
//  PasswordShield v2.0 — popup.js
//  TAB 1: Password Analyzer (Regex + ML heuristic)
//  TAB 2: Regex Validator (6 patterns + custom generator)
// ═══════════════════════════════════════════════════════

// ── Nav tab switching ────────────────────────────────────
document.querySelectorAll('.ntab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ntab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ════════════════════════════════════════════════════════
//  TAB 1 — PASSWORD ANALYZER
// ════════════════════════════════════════════════════════
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
const mlPct      = document.getElementById('mlPct');
const mlBar      = document.getElementById('mlBar');
const mlVerd     = document.getElementById('mlVerd');
const tipBox     = document.getElementById('tipBox');
const hibpBtn    = document.getElementById('hibpBtn');
const hibpRes    = document.getElementById('hibpRes');

const CIRCUMFERENCE = 2 * Math.PI * 25; // 157

// Toggle show/hide
eyeBtn.addEventListener('click', () => {
  const hidden = pwInput.type === 'password';
  pwInput.type = hidden ? 'text' : 'password';
  eyeBtn.textContent = hidden ? '🙈' : '👁';
});

// 7 regex rules — each has weight contributing to score
const RULES = [
  { id:'len',    label:'Length 10–128 chars',        weight:20, test: p => p.length >= 10 && p.length <= 128, detail: p => p.length + ' chars' },
  { id:'upper',  label:'Uppercase letter (A–Z)',     weight:15, test: p => /[A-Z]/.test(p) },
  { id:'lower',  label:'Lowercase letter (a–z)',     weight:10, test: p => /[a-z]/.test(p) },
  { id:'digit',  label:'Digit (0–9)',                weight:15, test: p => /[0-9]/.test(p) },
  { id:'spec',   label:'Special character (!@#$…)',  weight:20, test: p => /[^a-zA-Z0-9]/.test(p) },
  { id:'repeat', label:'No repeated chars (aaa…)',   weight:10, test: p => !/(.)\1{2,}/.test(p) },
  { id:'seq',    label:'No keyboard sequences',      weight:10, test: p => !/(123|234|345|456|qwerty|asdf|abcd)/i.test(p) },
];

const COMMON = [
  /^password/i,/^123456/,/^qwerty/i,/^abc123/i,/^letmein/i,
  /^welcome/i,/^monkey/i,/^dragon/i,/^admin/i,/^iloveyou/i,
  /^shadow/i,/^superman/i,/^master/i,/^sunshine/i,/^princess/i,
];

function mlRisk(pw) {
  let r = 0;
  for (const re of COMMON) if (re.test(pw)) { r += 50; break; }
  if ([...pw].every(c => /[a-z]/.test(c))) r += 30;
  if ([...pw].every(c => /[0-9]/.test(c))) r += 30;
  if (pw.length < 8)  r += 40;
  if (pw.length < 12) r += 15;
  const cs = (/[a-z]/.test(pw)?26:0)+(/[A-Z]/.test(pw)?26:0)+(/[0-9]/.test(pw)?10:0)+(/[^a-zA-Z0-9]/.test(pw)?32:0);
  r -= Math.min(40, (pw.length * Math.log2(cs||1)) / 3);
  return Math.max(0, Math.min(100, Math.round(r)));
}

const LEVELS = [
  {min:0,  max:19,  title:'Critically Weak', sub:'Crackable in seconds',       cls:'l0', color:'#ff4560'},
  {min:20, max:39,  title:'Weak',            sub:'Brute-force vulnerable',      cls:'l1', color:'#ff6b35'},
  {min:40, max:59,  title:'Fair',            sub:'Needs improvement',           cls:'l2', color:'#ffb020'},
  {min:60, max:79,  title:'Strong',          sub:'Good — consider going longer',cls:'l3', color:'#7ed321'},
  {min:80, max:100, title:'Very Strong',     sub:'Excellent security posture',  cls:'l4', color:'#00e676'},
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
  mlHigh: '⚠️ <strong>ML Alert:</strong> Pattern matches known breach databases. Choose something unique.',
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

  // Phase 1 — Regex
  const results = RULES.map(r => ({ ...r, pass: r.test(pw), det: r.detail ? r.detail(pw) : '' }));
  const regexScore = Math.round((results.reduce((s,r) => s + (r.pass ? r.weight : 0), 0) / 100) * 70);

  // Phase 2 — ML heuristic
  const risk = mlRisk(pw);
  const mlScore = Math.round((1 - risk/100) * 30);
  const total = Math.min(100, regexScore + mlScore);
  const lvl = getLevel(total);

  // Ring
  ringFill.style.strokeDashoffset = CIRCUMFERENCE - (total/100) * CIRCUMFERENCE;
  ringFill.style.stroke = lvl.color;
  ringNum.textContent = total;

  // Title/sub
  sTitle.textContent = lvl.title;
  sTitle.className = 's-title ' + lvl.cls;
  sSub.textContent = lvl.sub;

  // Badges
  const pc = results.filter(r => r.pass).length;
  sBadges.innerHTML =
    `<span class="bdg ${pc===RULES.length?'bp':pc>=5?'bw':'bf'}">${pc}/${RULES.length} rules</span>` +
    `<span class="bdg ${risk<30?'bp':risk<60?'bw':'bf'}">ML Risk: ${risk<30?'Low':risk<60?'Medium':'High'}</span>`;

  // Check rows
  chkRows.innerHTML = results.map(r =>
    `<div class="chk-row">
      <div class="chk-ico ${r.pass?'p':'f'}">${r.pass?'✓':'✗'}</div>
      <span class="chk-lbl">${r.label}</span>
      ${r.det ? `<span class="chk-val">${r.det}</span>` : ''}
    </div>`
  ).join('');

  // ML bar
  mlPct.textContent = risk + '% risk';
  mlBar.style.width = risk + '%';
  mlBar.style.background = risk < 30
    ? 'linear-gradient(90deg,#00e676,#7ed321)'
    : risk < 60
    ? 'linear-gradient(90deg,#ffb020,#ff6b35)'
    : 'linear-gradient(90deg,#ff4560,#7b2fff)';
  mlVerd.innerHTML = risk < 30
    ? '<strong>Low predictability.</strong> Not found in common breach signatures.'
    : risk < 60
    ? '<strong>Medium risk.</strong> Some elements match patterns in leaked password lists.'
    : '<strong>⚠ High risk.</strong> Pattern is common in breach databases — avoid using it.';

  // Tip
  const firstFail = results.find(r => !r.pass);
  tipBox.innerHTML = '<strong>💡 Tip</strong><br>' +
    (risk >= 60 ? TIPS.mlHigh : firstFail ? TIPS[firstFail.id] : TIPS.good);

  hibpRes.className = 'hibp-res hidden';
  hibpRes.textContent = '';
}

pwInput.addEventListener('input', () => renderPW(pwInput.value));

// HIBP k-anonymity check
hibpBtn.addEventListener('click', async () => {
  const pw = pwInput.value;
  if (!pw) return;
  hibpRes.className = 'hibp-res checking';
  hibpRes.textContent = 'Checking…';
  hibpRes.classList.remove('hidden');
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0,5)}`, { headers:{'Add-Padding':'true'} });
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
  } catch(e) {
    hibpRes.className = 'hibp-res';
    hibpRes.style.color = 'var(--warn)';
    hibpRes.textContent = '⚠ Check failed';
  }
});

// ════════════════════════════════════════════════════════
//  TAB 2 — REGEX VALIDATOR
// ════════════════════════════════════════════════════════

// ── Pattern definitions ──────────────────────────────────
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
      ['^',                       'Start anchor'],
      ['(\\+?[0-9]{1,3}[\\s\\-]?)?', 'Optional country code — + optional, 1–3 digits (e.g. +880, +1), optional space/hyphen. The ? makes the whole group optional'],
      ['(\\(?\\d{3}\\)?[\\s\\-]?)?',  'Optional area code — parentheses optional around 3 digits, optional separator'],
      ['\\d{3}[\\s\\-]?',         'First 3 subscriber digits, optional separator'],
      ['\\d{4,6}',                'Last 4–6 digits — handles BD 11-digit local and international formats'],
      ['$',                       'End anchor'],
    ]
  },
  password: {
    re: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/,
    display: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$/',
    pass: '✓ Strong password — all requirements met',
    fail: '✗ Weak — needs uppercase, lowercase, digit, special char, min 8 chars',
    examples: ['Secure@123', 'P@ssw0rd!', 'weakpass', 'NoSpecial1'],
    parts: [
      ['^',              'Start anchor'],
      ['(?=.*[a-z])',    'Lookahead — scans ahead to confirm at least one lowercase letter exists anywhere in the string'],
      ['(?=.*[A-Z])',    'Lookahead — confirms at least one uppercase letter exists anywhere'],
      ['(?=.*\\d)',      'Lookahead — confirms at least one digit (0–9) exists anywhere'],
      ['(?=.*[!@#$…])', 'Lookahead — confirms at least one special character exists anywhere'],
      ['[A-Za-z\\d…]{8,}', 'Actual character match — only allowed characters, minimum length 8. All 4 lookaheads must pass first'],
      ['$',              'End anchor — no extra characters allowed after'],
    ]
  },
  username: {
    re: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/,
    display: '/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/',
    pass: '✓ Valid username',
    fail: '✗ Invalid — start with letter, 3–20 chars, only letters/digits/underscore',
    examples: ['assad_dev', 'Valid123', 'ab', '_startunder'],
    parts: [
      ['^',              'Start anchor'],
      ['[a-zA-Z]',       'First character MUST be a letter — no leading digits or underscores allowed'],
      ['[a-zA-Z0-9_]',  'Remaining characters — letters, digits, or underscore only'],
      ['{2,19}',         '2 to 19 more characters after the first = total length 3 to 20'],
      ['$',              'End anchor'],
    ]
  },
  date: {
    re: /^(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-]\d{4}$|^\d{4}[\/\-](0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])$/,
    display: '/^(0[1-9]|[12]\\d|3[01])[\\/\\-](0[1-9]|1[0-2])[\\/\\-]\\d{4}$|^\\d{4}[\\/\\-](0[1-9]|1[0-2])[\\/\\-](0[1-9]|[12]\\d|3[01])$/',
    pass: '✓ Valid date format',
    fail: '✗ Invalid — use DD/MM/YYYY, DD-MM-YYYY or YYYY-MM-DD',
    examples: ['25/12/2024', '2024-01-15', '01-06-2025', '32/13/2024'],
    parts: [
      ['(0[1-9]|[12]\\d|3[01])',  'Day — 01–09 OR 10–29 (1 or 2 prefix) OR 30–31. Prevents 00 and 32+'],
      ['[\\/\\-]',                'Separator — accepts / or - as delimiter'],
      ['(0[1-9]|1[0-2])',         'Month — 01–09 OR 10–12. Prevents 00 and 13+'],
      ['\\d{4}',                  'Year — exactly 4 digits'],
      ['|',                       'Alternation operator — the right side handles ISO format YYYY-MM-DD'],
      ['^\\d{4}[\\/\\-]…',       'Second branch — year comes first, then month, then day (ISO 8601 format)'],
    ]
  },
  time: {
    re: /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$|^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i,
    display: '/^([01]\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$|^(0?[1-9]|1[0-2]):[0-5]\\d\\s?(AM|PM)$/i',
    pass: '✓ Valid time format',
    fail: '✗ Invalid — use HH:MM, HH:MM:SS (24h) or H:MM AM/PM (12h)',
    examples: ['14:30', '09:05:59', '12:30 PM', '25:61'],
    parts: [
      ['([01]\\d|2[0-3])',  '24h hour — 00–09 or 10–19 (prefix 0 or 1) or 20–23. Blocks 24–29'],
      [':',                 'Literal colon separator'],
      ['([0-5]\\d)',        'Minutes — first digit 0–5, second 0–9. Blocks 60–99'],
      ['(:[0-5]\\d)?',      'Optional seconds — same constraint as minutes. The ? makes the whole group optional'],
      ['|',                 'Alternation — second branch handles 12-hour clock format'],
      ['(0?[1-9]|1[0-2])', '12h hour — 1–9 with optional leading zero, or 10–12'],
      ['\\s?(AM|PM)',       'Optional space then AM or PM'],
      ['/i flag',           'Case-insensitive — accepts am, pm, Am, PM etc.'],
    ]
  },
};

// ── Custom pattern library ───────────────────────────────
const CUSTOM_LIBRARY = [
  {
    keys: ['nid','national id','bd nid','bangladesh nid'],
    re: '/^[0-9]{10}$|^[0-9]{13}$/',
    regex: /^[0-9]{10}$|^[0-9]{13}$/,
    explain: `<b>^[0-9]{10}$</b> — exactly 10 digits<br>
<b>|</b> — OR operator<br>
<b>^[0-9]{13}$</b> — exactly 13 digits<br><br>
<b>[0-9]</b> matches any single digit 0–9.<br>
<b>{10}</b> means "exactly 10 repetitions".<br>
The <b>|</b> alternation lets EITHER format match.<br>
<b>^</b> and <b>$</b> anchors ensure no extra characters.`
  },
  {
    keys: ['ipv4','ip address','ip'],
    re: '/^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(same×3)$/',
    regex: /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
    explain: `Each of the 4 groups matches one octet (0–255):<br>
<b>25[0-5]</b> → matches 250–255<br>
<b>2[0-4]\\d</b> → matches 200–249<br>
<b>[01]?\\d\\d?</b> → matches 0–199<br>
<b>\\.</b> is a literal dot (must escape . or it means "any char").<br>
The same group repeats 4 times joined by dots = 4 octets.`
  },
  {
    keys: ['hex color','hex code','color code','colour'],
    re: '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
    regex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    explain: `<b>#</b> — literal hash character (required)<br>
<b>[A-Fa-f0-9]</b> — hex digits: 0–9 and A–F (case insensitive)<br>
<b>{6}</b> — full 6-digit code like <code>#FF5733</code><br>
<b>|</b> — OR<br>
<b>{3}</b> — shorthand like <code>#F73</code><br>
<b>^</b> and <b>$</b> ensure exact match only.`
  },
  {
    keys: ['url','website','link','http'],
    re: '/^(https?:\\/\\/)(www\\.)?[a-zA-Z0-9\\-.]+\\.[a-zA-Z]{2,}(\\/\\S*)?$/',
    regex: /^(https?:\/\/)(www\.)?[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?$/,
    explain: `<b>https?</b> — http or https (the ? makes "s" optional)<br>
<b>:\\/\\/</b> — literal :// (slashes must be escaped)<br>
<b>(www\\.)?</b> — optional www. subdomain<br>
<b>[a-zA-Z0-9\\-.]+</b> — domain characters<br>
<b>\\.[a-zA-Z]{2,}</b> — TLD like .com, .io, .org<br>
<b>(\\/\\S*)?</b> — optional URL path (no spaces)`
  },
  {
    keys: ['zip','postal','postcode','bd zip','bangladesh postal'],
    re: '/^[1-9]\\d{3}$/',
    regex: /^[1-9]\d{3}$/,
    explain: `Bangladesh postal codes are exactly 4 digits and never start with 0.<br>
<b>[1-9]</b> — first digit must be 1–9 (no leading zero)<br>
<b>\\d{3}</b> — exactly 3 more digits (\\d = any digit 0–9)<br>
<b>^</b> and <b>$</b> — exact 4-digit match, no more, no less.`
  },
  {
    keys: ['credit card','card number','visa','mastercard'],
    re: '/^(4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$/',
    regex: /^(4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})$/,
    explain: `<b>4[0-9]{12}([0-9]{3})?</b> — Visa: starts with 4, 13 or 16 digits<br>
<b>5[1-5][0-9]{14}</b> — Mastercard: starts with 51–55, 16 digits<br>
<b>3[47][0-9]{13}</b> — Amex: starts with 34 or 37, 15 digits<br>
<b>|</b> separates the three card type branches.<br>
Note: This checks format only, not validity (use Luhn algorithm for that).`
  },
  {
    keys: ['mac address','mac','mac addr'],
    re: '/^([0-9A-Fa-f]{2}[:\\-]){5}[0-9A-Fa-f]{2}$/',
    regex: /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/,
    explain: `<b>[0-9A-Fa-f]{2}</b> — two hex characters = one byte<br>
<b>[:\\-]</b> — colon or hyphen separator<br>
<b>{5}</b> — the "byte:separator" group repeats 5 times<br>
Then a final bare byte (no trailing separator)<br>
Total: 6 groups of 2 hex chars = 48-bit MAC address<br>
Example: <code>00:1A:2B:3C:4D:5E</code>`
  },
  {
    keys: ['passport','passport number','bd passport'],
    re: '/^[A-Z]{2}[0-9]{7}$/',
    regex: /^[A-Z]{2}[0-9]{7}$/,
    explain: `Bangladesh passport number format:<br>
<b>[A-Z]{2}</b> — exactly 2 uppercase letters (series code)<br>
<b>[0-9]{7}</b> — exactly 7 digits<br>
<b>^</b> and <b>$</b> anchors ensure exact 9-character match.<br>
Example: <code>AB1234567</code>`
  },
];

// ── State ────────────────────────────────────────────────
let currentPattern = 'email';
let customRegex = null;

// ── Init ─────────────────────────────────────────────────
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
    document.getElementById('rxInput').placeholder = 'Type a value to test…';
    renderExamples(currentPattern);
    renderResult('');
  });

  document.getElementById('rxInput').addEventListener('input', e => {
    renderResult(e.target.value);
  });

  document.getElementById('rxGenBtn').addEventListener('click', generateCustom);
  document.getElementById('rxCustInp').addEventListener('keydown', e => {
    if (e.key === 'Enter') generateCustom();
  });
}

function renderExamples(pat) {
  const p = PATTERNS[pat];
  const wrap = document.getElementById('rxExamples');
  wrap.innerHTML = p.examples.map(ex =>
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

  // Always show regex and explanation
  regexEl.textContent = p.display;
  partsEl.innerHTML = p.parts.map(([tok, desc]) =>
    `<div class="rx-part"><span class="rx-tok">${tok}</span><span class="rx-desc">${desc}</span></div>`
  ).join('');

  // Update chip dot for this pattern
  const chip = document.querySelector(`.rx-chip[data-p="${currentPattern}"]`);

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

  // Update inactive chip dot too
  document.querySelectorAll('.rx-chip').forEach(c => {
    if (c.dataset.p !== currentPattern) return;
    c.className = `rx-chip active ${ok ? 'vpass' : 'vfail'}`;
  });
}

function generateCustom() {
  const desc = document.getElementById('rxCustInp').value.trim().toLowerCase();
  if (!desc) return;

  const match = CUSTOM_LIBRARY.find(m => m.keys.some(k => desc.includes(k)));
  const outWrap = document.getElementById('rxCustOut');
  const outBody = document.getElementById('rxCustBody');
  outWrap.classList.remove('hidden');

  if (match) {
    customRegex = match.regex;
    outBody.innerHTML =
      `<div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px">Generated Regex</div>
       <div class="rx-regex" style="margin-bottom:10px">${match.re}</div>
       <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px">Explanation</div>
       <div style="font-size:11px;color:var(--text-dim);line-height:1.7;margin-bottom:10px">${match.explain}</div>
       <div style="font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px">Test it</div>
       <input class="rx-cust-test-inp" id="rxCustTestInp" placeholder="Enter a value to test this pattern…"/>
       <div class="rx-cust-res" id="rxCustRes"></div>`;

    document.getElementById('rxCustTestInp').addEventListener('input', e => {
      const v = e.target.value;
      const el = document.getElementById('rxCustRes');
      if (!v) { el.textContent = ''; return; }
      const ok = customRegex.test(v);
      el.className = 'rx-cust-res ' + (ok ? 'p' : 'f');
      el.textContent = ok ? '✓ Match — pattern valid' : '✗ No match';
    });
  } else {
    customRegex = null;
    outBody.innerHTML =
      `<div style="color:var(--warn);font-size:12px;margin-bottom:8px">
        ⚠ Pattern not in built-in library.
      </div>
      <div style="font-size:11px;color:var(--text-dim);line-height:1.7">
        Try describing one of these built-in patterns:<br>
        <b style="color:var(--text)">BD NID, IPv4 address, hex color, URL/website, Bangladesh postal code, credit card number, MAC address, passport number</b>
      </div>`;
  }
}

// ── Boot ─────────────────────────────────────────────────
initRegexTab();
