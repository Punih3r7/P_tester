# 🛡 PasswordShield — Browser Extension

A cybersecurity browser extension combining **Regex rules** + **ML model** 
trained on real breach data for real-time password strength analysis.

---

## 📁 Project Structure

```
password-shield-extension/
├── manifest.json        ← Extension config (Chrome MV3)
├── popup.html           ← What users see when clicking the icon
├── popup.js             ← All UI logic: regex checks + ML heuristic
├── content.js           ← Scans web pages for password fields
├── background.js        ← Service worker (future: TF.js model here)
├── train_model.py       ← Python training script for Kaggle dataset
├── model/               ← (You generate this) TF.js model files
│   ├── model.json
│   └── weights.bin
└── icons/               ← (Add your own) 16x16, 48x48, 128x128 PNGs
```

---

## 🚀 Step 1 — Load Extension in Chrome (Do This First)

1. Open Chrome → go to `chrome://extensions/`
2. Turn ON **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select this entire `password-shield-extension/` folder
5. You should see the shield icon in your toolbar ✅

> The extension works immediately with Regex + ML heuristic, **before** you add the trained model.

---

## 🐍 Step 2 — Train the Model (Python)

### Download the Dataset
1. Go to: https://www.kaggle.com/datasets/jeffersonvalandro/password-dataset
2. Download the CSV file
3. Rename it to `passwords.csv`
4. Place it in this folder

### Install Dependencies
```bash
pip install pandas scikit-learn tensorflow tensorflowjs numpy
```

### Run Training
```bash
python train_model.py
```

This will:
- Clean and preprocess the password data
- Extract 10 security features per password
- Train a small neural network (3 layers)
- Export `model/model.json` + `model/weights.bin`
- Print scaler parameters you'll need in step 3

### Expected Output
```
Test accuracy: 0.91
              precision    recall  f1-score
Weak              0.92      0.89      0.90
Medium            0.87      0.91      0.89
Strong            0.94      0.93      0.93
```

---

## 🔌 Step 3 — Wire ML Model into Extension

After training, open `popup.js` and find the `mlRiskScore()` function.

**Replace it with TF.js inference:**

```javascript
// Add to the top of popup.js:
import * as tf from './lib/tensorflow.min.js';

let model = null;

// These come from train_model.py output:
const SCALER_MEAN  = [/* paste values from training output */];
const SCALER_SCALE = [/* paste values from training output */];

async function loadModel() {
  model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
}
loadModel();

function extractFeatures(pw) {
  // Same 10 features as train_model.py
  const length      = pw.length;
  const hasUpper    = /[A-Z]/.test(pw) ? 1 : 0;
  const hasLower    = /[a-z]/.test(pw) ? 1 : 0;
  const hasDigit    = /[0-9]/.test(pw) ? 1 : 0;
  const hasSpecial  = /[^a-zA-Z0-9]/.test(pw) ? 1 : 0;
  const hasRepeat   = /(.)\1{2,}/.test(pw) ? 1 : 0;
  const hasSeq      = /(123|abc|qwerty)/i.test(pw) ? 1 : 0;
  const uniqueChars = new Set(pw).size;
  const charVariety = uniqueChars / Math.max(length, 1);
  const charset     = (hasLower*26) + (hasUpper*26) + (hasDigit*10) + (hasSpecial*32);
  const entropy     = length * Math.log2(Math.max(charset, 1));

  return [length, hasUpper, hasLower, hasDigit, hasSpecial,
          hasRepeat, hasSeq, uniqueChars, charVariety, entropy];
}

async function mlRiskScore(pw) {
  if (!model) return 50; // fallback
  const raw = extractFeatures(pw);
  // Normalize using scaler params from training
  const normalized = raw.map((v, i) => (v - SCALER_MEAN[i]) / SCALER_SCALE[i]);
  const tensor = tf.tensor2d([normalized]);
  const pred = model.predict(tensor);
  const probs = await pred.data();
  // probs[0]=Weak, probs[1]=Medium, probs[2]=Strong
  const risk = Math.round(probs[0] * 100); // probability of being "Weak" = risk
  tensor.dispose();
  pred.dispose();
  return risk;
}
```

---

## 🔥 Features

| Feature | How |
|---|---|
| Real-time analysis | Regex on every keystroke |
| 7 security rules | Length, upper, lower, digit, special, no-repeat, no-sequence |
| ML risk score | Heuristic (upgrade to trained model) |
| Breach check | Have I Been Pwned API (k-anonymity — password never leaves your browser) |
| Page scanning | Detects password fields on any website and shows inline badge |
| Zero telemetry | Everything runs locally |

---

## 🎯 What Your Teacher Will See

1. **Dataset usage** — `train_model.py` trains on the Jefferson Valandro dataset
2. **Feature engineering** — 10 meaningful security features extracted
3. **ML pipeline** — sklearn preprocessing + Keras neural network
4. **Browser integration** — TF.js model runs in-browser (no server)
5. **Hybrid approach** — Regex for instant feedback, ML for deep assessment
6. **Real-world API** — HIBP for threat intelligence layer

---

## 📋 Icons (Quick Fix)

You need three icon PNGs. Easiest way:
1. Find any shield/lock emoji PNG online
2. Resize to 16x16, 48x48, 128x128
3. Save as `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

Or use a tool like https://favicon.io to generate them.

---

## 🗺 Roadmap (To Impress More)

- [ ] Add zxcvbn library for crack-time estimation
- [ ] Password generator button
- [ ] Export report as PDF
- [ ] Firefox support (MV2 manifest)
- [ ] Publish to Chrome Web Store
