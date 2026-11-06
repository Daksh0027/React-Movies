// Aggressive caching utility for instant loading
class DataCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set expiration
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, this.CACHE_DURATION);

    this.timeouts.set(key, timeout);
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      this.cache.delete(key);
      this.timeouts.delete(key);
      return null;
    }

    return cached.data;
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  clear() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.cache.clear();
    this.timeouts.clear();
  }
}

export const dataCache = new DataCache();
