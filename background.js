// ─────────────────────────────────────────────
//  PasswordShield — background.js (service worker)
//
//  This is where TensorFlow.js model will be
//  loaded once you convert your Kaggle model.
//
//  Current state: placeholder that responds to
//  messages from popup.js
// ─────────────────────────────────────────────

// When your TF.js model is ready, uncomment this:
// import * as tf from './lib/tensorflow.js';
// let model = null;
// async function loadModel() {
//   model = await tf.loadLayersModel(chrome.runtime.getURL('model/model.json'));
//   console.log('[PasswordShield] Model loaded ✓');
// }
// loadModel();

// Listen for requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ML_SCORE') {
    // TODO: Replace with actual model inference
    // const score = await runModelInference(request.password);
    sendResponse({ score: null, message: 'Model not loaded yet' });
  }
  return true; // keeps message channel open for async
});

console.log('[PasswordShield] Service worker started');
