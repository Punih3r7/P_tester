// PasswordShield v2.0 — background service worker
// ML model wiring goes here once train_model.py is run
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'ML_SCORE') {
    sendResponse({ score: null, message: 'Model not loaded yet' });
  }
  return true;
});
console.log('[PasswordShield] Service worker v2.0 started');
