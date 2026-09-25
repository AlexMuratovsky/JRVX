/**
 * Compatibility boundary for the reconstructed JRVX client.
 *
 * New source code uses only JRVX naming. If a deployed backend or persisted
 * browser store still requires a historical key, map it here instead of
 * spreading legacy names through the app.
 */
export const compatibility = Object.freeze({
  storage: {},
  headers: {},
  routes: {},
});

export function resolveCompatibilityValue(group, key, fallback = key) {
  return compatibility[group]?.[key] ?? fallback;
}
