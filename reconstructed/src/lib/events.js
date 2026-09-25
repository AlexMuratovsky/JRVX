export const JRVX_CHANGED_EVENT = "jrvx-changed";

export function announceJrvxChange(detail = null) {
  window.dispatchEvent(new CustomEvent(JRVX_CHANGED_EVENT, { detail }));
}

export function subscribeToJrvxChanges(listener) {
  window.addEventListener(JRVX_CHANGED_EVENT, listener);
  return () => window.removeEventListener(JRVX_CHANGED_EVENT, listener);
}
