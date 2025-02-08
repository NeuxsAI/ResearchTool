import { Paper } from './types';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresIn: number;
};

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

export const cache = Cache.getInstance();

// Cache keys
export const CACHE_KEYS = {
  PAPERS: 'papers',
  CATEGORIES: 'categories',
  READING_LIST: 'reading_list',
  TRENDING_PAPERS: 'trending_papers',
  RECOMMENDED_PAPERS: 'recommended_papers',
  RECENT_PAPERS: 'recent_papers',
  ANNOTATIONS: (paperId: string) => `annotations_${paperId}`,
} as const; 