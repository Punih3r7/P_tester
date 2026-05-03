"""
PasswordShield — Model Training Script
=======================================
Train on the Jefferson Valandro Kaggle dataset and export
a TensorFlow.js model for the browser extension.

Dataset: https://www.kaggle.com/datasets/jeffersonvalandro/password-dataset

Setup:
  pip install pandas scikit-learn tensorflow tensorflowjs numpy

Run:
  python train_model.py

Output:
  model/model.json + model/weights.bin  (copy these into your extension folder)
"""

import os
import re
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

import tensorflow as tf
from tensorflow import keras
import tensorflowjs as tfjs

# ── 1. Load Dataset ──────────────────────────────────────────────────────────
print("[1/6] Loading dataset…")

# The Kaggle dataset has columns: password, strength
# strength: 0 = Weak, 1 = Medium, 2 = Strong
df = pd.read_csv("passwords.csv")  # rename your downloaded CSV to this

print(f"      Raw rows: {len(df)}")
print(df.head())

# ── 2. Clean Data ─────────────────────────────────────────────────────────────
print("[2/6] Cleaning data…")

# Drop nulls
df = df.dropna(subset=["password", "strength"])

# Keep only string passwords
df = df[df["password"].apply(lambda x: isinstance(x, str))]

# Remove obvious non-passwords (emails, URLs, very short/long)
df = df[df["password"].apply(lambda x:
    5 <= len(x) <= 128 and
    "@" not in x and
    "http" not in x.lower()
)]

print(f"      Clean rows: {len(df)}")
print(df["strength"].value_counts())

# ── 3. Feature Engineering ────────────────────────────────────────────────────
print("[3/6] Engineering features…")

def extract_features(pw):
    pw = str(pw)
    length = len(pw)
    has_upper  = int(bool(re.search(r'[A-Z]', pw)))
    has_lower  = int(bool(re.search(r'[a-z]', pw)))
    has_digit  = int(bool(re.search(r'[0-9]', pw)))
    has_special= int(bool(re.search(r'[^a-zA-Z0-9]', pw)))
    has_repeat = int(bool(re.search(r'(.)\1{2,}', pw)))
    has_seq    = int(bool(re.search(r'(123|234|abc|qwerty|asdf)', pw, re.I)))
    unique_chars = len(set(pw))
    char_variety = unique_chars / max(length, 1)

    # Charset size for entropy estimate
    charset = (
        (26 if has_lower else 0) +
        (26 if has_upper else 0) +
        (10 if has_digit else 0) +
        (32 if has_special else 0)
    )
    entropy = length * np.log2(max(charset, 1))

    return [
        length,
        has_upper,
        has_lower,
        has_digit,
        has_special,
        has_repeat,
        has_seq,
        unique_chars,
        char_variety,
        entropy,
    ]

FEATURE_NAMES = [
    "length", "has_upper", "has_lower", "has_digit", "has_special",
    "has_repeat", "has_seq", "unique_chars", "char_variety", "entropy"
]

X = np.array([extract_features(pw) for pw in df["password"]], dtype=np.float32)
y = df["strength"].astype(int).values

print(f"      Feature matrix: {X.shape}")

# ── 4. Train / Test Split ─────────────────────────────────────────────────────
print("[4/6] Splitting data…")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Normalize features
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)

# Save scaler parameters (you'll hard-code these into popup.js later)
print("      Scaler mean:", scaler.mean_.tolist())
print("      Scaler scale:", scaler.scale_.tolist())

# ── 5. Build & Train Neural Network ──────────────────────────────────────────
print("[5/6] Training model…")

num_classes = len(np.unique(y))

model = keras.Sequential([
    keras.layers.Input(shape=(len(FEATURE_NAMES),)),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(num_classes, activation='softmax'),
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=512,
    validation_split=0.1,
    verbose=1,
)

# Evaluate
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n      Test accuracy: {acc:.4f}")

y_pred = np.argmax(model.predict(X_test, verbose=0), axis=1)
print("\n" + classification_report(y_test, y_pred, target_names=["Weak","Medium","Strong"]))

# ── 6. Export to TensorFlow.js ────────────────────────────────────────────────
print("[6/6] Exporting model to TF.js format…")

os.makedirs("model", exist_ok=True)
tfjs.converters.save_keras_model(model, "model")

print("\n✅  Done! Copy the 'model/' folder into your extension directory.")
print("    Then update popup.js to call the model via background.js.")
print("\n    Scaler params to hard-code in popup.js:")
print(f"    mean  = {scaler.mean_.tolist()}")
print(f"    scale = {scaler.scale_.tolist()}")
