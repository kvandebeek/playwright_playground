(() => {
  /**
   * dashboard.js
   * - Default: "live" mode mutates metric values periodically
   * - ?mode=static: do not mutate metric values (keep markup values)
   * - ?seed=123: deterministic values derived from seed (stable)
   */

  const PARAMS = new URLSearchParams(window.location.search);
  const MODE = PARAMS.get('mode') === 'static' ? 'static' : 'live';
  const SEED_PARAM = PARAMS.get('seed');
  const SEED = SEED_PARAM !== null && SEED_PARAM.trim() !== '' ? SEED_PARAM.trim() : null;

  /** @type {const} */
  const METRIC = {
    orders: { testId: 'metric-orders', min: 0, max: 2000 },
    tickets: { testId: 'metric-tickets', min: 0, max: 500 },
    incidents: { testId: 'metric-incidents', min: 0, max: 50 },
  };

  /** @type {const} */
  const DISABLED_RULES = [
    { cardTestId: 'metric-orders', buttonIndex: 1, disabled: true }, // Export disabled
    { cardTestId: 'metric-incidents', buttonIndex: 0, disabled: true }, // Acknowledge disabled
  ];

  function clampInt(value, min, max) {
    const n = Number.parseInt(String(value), 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  // Simple stable hash -> uint32
  function hashToUint32(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededInt(seedStr, keyStr, min, max) {
    const range = Math.max(0, max - min);
    if (range === 0) return min;
    const u = hashToUint32(`${seedStr}::${keyStr}`);
    return min + (u % (range + 1));
  }

  function getCardByTestId(cardTestId) {
    return document.querySelector(`[data-testid="${cardTestId}"]`);
  }

  function getMetricValueEl(cardEl) {
    if (!cardEl) return null;
    return cardEl.querySelector(`[data-testid="metric-value"]`);
  }

  function applyDisabledDemoStates() {
    for (const rule of DISABLED_RULES) {
      const card = getCardByTestId(rule.cardTestId);
      if (!card) continue;

      const buttons = card.querySelectorAll(`[data-testid="btn"]`);
      const btn = buttons.item(rule.buttonIndex);
      if (!btn) continue;

      btn.disabled = Boolean(rule.disabled);
    }
  }

  function setSeededMetrics(seedStr) {
    const entries = Object.entries(METRIC);
    for (const [key, cfg] of entries) {
      const card = getCardByTestId(cfg.testId);
      const valueEl = getMetricValueEl(card);
      if (!valueEl) continue;

      const next = seededInt(seedStr, key, cfg.min, cfg.max);
      valueEl.textContent = String(next);
    }
  }

  function tickLiveMetrics() {
    const entries = Object.entries(METRIC);
    for (const [_, cfg] of entries) {
      const card = getCardByTestId(cfg.testId);
      const valueEl = getMetricValueEl(card);
      if (!valueEl) continue;

      const current = clampInt(valueEl.textContent, cfg.min, cfg.max);
      const delta = Math.floor(Math.random() * 25);
      const next = clampInt(current + delta, cfg.min, cfg.max);
      valueEl.textContent = String(next);
    }
  }

  function init() {
    applyDisabledDemoStates();

    if (MODE === 'static') {
      // Keep initial HTML values as-is (deterministic).
      return;
    }

    if (SEED !== null) {
      // Deterministic values for tests/debugging.
      setSeededMetrics(SEED);
      return;
    }

    // Live mode (non-deterministic).
    tickLiveMetrics();
    window.setInterval(() => {
      tickLiveMetrics();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
