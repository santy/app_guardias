interface CacheData<T> {
  data: T;
  timestamp: number;
  lastUpdate: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export const cacheService = {
  set<T>(key: string, data: T): void {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      lastUpdate: new Date().toLocaleString('es-ES')
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  },

  get<T>(key: string): { data: T; lastUpdate: string } | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheData.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }

      return {
        data: cacheData.data,
        lastUpdate: cacheData.lastUpdate
      };
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },

  clear(key: string): void {
    localStorage.removeItem(key);
  }
};
