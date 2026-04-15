/* ─── Local Storage persistence layer ─── */
/* Used as fallback when Firebase is not configured */

const PREFIX = 'ft_';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage write failed:', error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};
