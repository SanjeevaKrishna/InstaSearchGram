// Safe localStorage helper functions to prevent exceptions in private browsing or restricted mobile views
export const safeStorage = {
  getItem(key, defaultValue = null) {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : defaultValue;
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}":`, e);
      return defaultValue;
    }
  },

  setItem(key, value) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
    }
  },

  removeItem(key) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, e);
    }
  }
};
