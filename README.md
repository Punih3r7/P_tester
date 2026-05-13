# 🛡 PasswordShield v2.0
### Browser Extension — Password Analyzer + Regex Pattern Validator

A cybersecurity browser extension built for security students and professionals.  
Combines **real-time password strength analysis** (Regex + ML) with a **full Regex Pattern Validator** that explains every pattern part by part.

---

## 📸 What It Does

### Tab 1 — Password Analyzer
- Tests your password against 7 security rules using Regex
- Gives an ML-based risk score (0–100%)
- Shows an animated strength ring (Critically Weak → Very Strong)
- Checks if your password appeared in real data breaches via **Have I Been Pwned API**
- All analysis runs **locally in your browser** — your password never leaves your device

### Tab 2 — Regex Validator
- Validates 6 common patterns: **Email, Phone Number, Password, Username, Date, Time**
- Shows the full regex for each pattern
- Explains **every part of the regex** in plain English
- Includes a **Custom Pattern Generator** — type a description and get a regex instantly
- Built-in custom patterns: BD NID, IPv4, Hex Color, URL, Postal Code, Credit Card, MAC Address, Passport Number

---

## 🖥 Requirements

- **Google Chrome** (version 88 or higher) — supports Manifest V3
- OR **Microsoft Edge** (Chromium-based)
- No internet required (except for the optional breach check)
- No installation of Node.js, Python, or any server needed

---

## 📦 Installation

### Step 1 — Download
Download the ZIP file and extract it to a folder on your computer.  
You should see these files inside:
```
password-shield-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── model/
```

### Step 2 — Open Chrome Extensions Page
Open Google Chrome and go to:
```
chrome://extensions/
```
Or: Click the **three dots menu** → More Tools → Extensions

### Step 3 — Enable Developer Mode
In the top-right corner of the Extensions page, toggle **"Developer mode"** ON.  
You will see three new buttons appear: Load unpacked, Pack extension, Update.

### Step 4 — Load the Extension
1. Click **"Load unpacked"**
2. Navigate to and select the `password-shield-extension` folder you extracted
3. Click **"Select Folder"**

### Step 5 — Pin It (Recommended)
1. Click the **puzzle piece icon** 🧩 in the Chrome toolbar
2. Find **PasswordShield** in the list
3. Click the **pin icon** 📌 to keep it visible in your toolbar

✅ You should now see the shield icon in your browser toolbar. Click it to open the extension.

---

## 🚀 How to Use

### Password Analyzer Tab
1. Click the extension icon in your toolbar
2. You are on the **🔐 Password Analyzer** tab by default
3. Type any password in the input field
4. Results update **instantly** as you type:
   - Score ring shows strength out of 100
   - Green ✓ / Red ✗ checks show which rules pass or fail
   - ML bar shows how predictable your password is
5. Click **"🔥 Check Breaches"** to check if the password was in a data breach
   - Uses k-anonymity — only the first 5 characters of the SHA-1 hash are sent
   - Your actual password is never transmitted

### Regex Validator Tab
1. Click the **🔎 Regex Validator** tab at the top
2. Click any pattern chip: **Email, Phone, Password, Username, Date, Time**
3. The regex and its full explanation appear immediately
4. Click any **example chip** to auto-fill a test value
5. Or type your own value — it validates in real time
6. To generate a custom regex, scroll down to **Custom Pattern Generator**:
   - Type a description like `BD NID` or `IPv4 address` or `hex color`
   - Click **Generate ↗**
   - See the regex, full explanation, and test it live

### On Any Website
The extension also works **automatically on any webpage** with a password field.  
When you type in a password box on any login or signup form, a live badge appears:
- 🔴 Critically Weak
- 🟠 Weak
- 🟡 Fair
- 🟢 Strong
- 🟢 Very Strong

---

## 🧪 Custom Pattern Generator — Supported Keywords

Type any of these descriptions in the Custom Pattern Generator:

| What you type | What you get |
|---|---|
| `BD NID` or `national id` | Bangladesh NID (10 or 13 digits) |
| `IPv4` or `ip address` | IPv4 address like 192.168.1.1 |
| `hex color` or `color code` | Hex color like #FF5733 or #F73 |
| `URL` or `website` | Full URL with http/https |
| `zip` or `postal` or `postcode` | Bangladesh 4-digit postal code |
| `credit card` or `visa` | Visa / Mastercard / Amex format |
| `MAC address` | MAC like 00:1A:2B:3C:4D:5E |
| `passport` | Bangladesh passport number |

---

## 🔒 Privacy

- ✅ No data is collected or stored remotely
- ✅ Passwords are never sent anywhere
- ✅ The breach check uses **k-anonymity** (only a partial SHA-1 hash prefix is sent to Have I Been Pwned)
- ✅ All regex and ML analysis runs entirely in your browser
- ✅ No account, login, or signup required

## 🗂 File Structure

```
password-shield-extension/
│
├── manifest.json       ← Extension config (Chrome Manifest V3)
├── popup.html          ← UI layout for both tabs
├── popup.js            ← All logic: password analysis + regex validator
├── content.js          ← Scans web pages for password fields
├── background.js       ← Service worker (ML model loader)
├── icons/
   ├── icon16.png      ← Toolbar icon (16×16)
   ├── icon48.png      ← Extensions page icon (48×48)
   └── icon128.png     ← Chrome Web Store icon (128×128)


```

---

## 🛠 Troubleshooting

**"Could not load manifest" error**
→ Make sure you selected the folder that *contains* `manifest.json`, not a parent folder.

**Extension icon not showing**
→ Click the 🧩 puzzle icon in Chrome toolbar and pin PasswordShield.

**Breach check not working**
→ You need an internet connection for the Have I Been Pwned API call.

**Extension not updating after changes**
→ Go to `chrome://extensions/` and click the 🔄 reload button under PasswordShield.

**"Developer mode extensions" warning on startup**
→ This is normal for unpacked extensions. Click "Keep" or "Cancel" to dismiss it.

---

## 👨‍💻 Built With

- **HTML / CSS / JavaScript** — Extension UI and logic
- **Regex** — Phase 1 pattern validation
- **ML heuristic / Random Forest** — Phase 2 risk scoring
- **Have I Been Pwned API** — Breach intelligence (k-anonymity)
- **Web Crypto API** — SHA-1 hashing in-browser
- **Chrome Extensions Manifest V3** — Extension platform

---

## ⚠️ Disclaimer

This tool is built for **educational purposes** as part of a cybersecurity course project.  
Only test passwords on systems and accounts you own or have permission to test.

---

*Built as a Practical Lab project — 6th Semester, Cybersecurity*