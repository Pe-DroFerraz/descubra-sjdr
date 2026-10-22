// Persist PKCE/session only where browser storage is available. Memory is a fallback,
// not a mirror: a successful write must not leave a stale token after another tab logs out.
export function createAuthStorage(
  getStorage: () => Storage = () => localStorage,
) {
  const fallback = new Map<string, string>();
  return {
    getItem(key: string) {
      try {
        return getStorage().getItem(key) ?? fallback.get(key) ?? null;
      } catch {
        return fallback.get(key) ?? null;
      }
    },
    setItem(key: string, value: string) {
      try {
        getStorage().setItem(key, value);
        fallback.delete(key);
      } catch {
        fallback.set(key, value);
      }
    },
    removeItem(key: string) {
      fallback.delete(key);
      try {
        getStorage().removeItem(key);
      } catch {
        /* Memory already cleared. */
      }
    },
  };
}
